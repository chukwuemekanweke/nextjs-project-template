[CmdletBinding()]
param(
    [Parameter(Position = 0, Mandatory = $true)]
    [ValidateSet("start", "check", "publish", "status", "finish")]
    [string]$Command,

    [ValidateRange(1, 999999)]
    [int]$Epic,

    [ValidateRange(1, 999999)]
    [int]$Feature,

    [string]$Label,

    [switch]$SkipChecks,

    [switch]$Ready
)

$ErrorActionPreference = "Stop"
$script:RepositoryRoot = Split-Path -Parent $PSScriptRoot
$script:BranchPattern = '^epic-(?<epic>\d+)/fe-(?<feature>\d+)-(?<label>[a-z0-9]+(?:-[a-z0-9]+)*)$'

function Assert-CommandExists {
    param([Parameter(Mandatory = $true)][string]$Name)

    if ($null -eq (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found on PATH."
    }
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Executable,
        [Parameter()][string[]]$Arguments = @()
    )

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Executable $($Arguments -join ' ')"
    }
}

function Get-CurrentBranch {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) {
        throw "Unable to determine the current Git branch."
    }

    return $branch
}

function Assert-CleanWorkingTree {
    $status = (& git status --porcelain) -join "`n"
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to inspect the Git working tree."
    }

    if (-not [string]::IsNullOrWhiteSpace($status)) {
        throw "The working tree must be clean before starting a branch. Commit, stash, or remove the listed changes first.`n$status"
    }
}

function Assert-FeatureBranch {
    param([Parameter(Mandatory = $true)][string]$Branch)

    if ($Branch -notmatch $script:BranchPattern) {
        throw "Branch '$Branch' does not match epic-{number}/fe-{number}-{label}."
    }

    return @{
        Epic = $Matches.epic
        Feature = $Matches.feature
        Label = $Matches.label
    }
}

function Test-StagedChanges {
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        return $false
    }

    if ($LASTEXITCODE -ne 1) {
        throw "Unable to inspect staged changes."
    }

    return $true
}

function Invoke-Checks {
    Write-Host "Running repository checks..." -ForegroundColor Cyan
    Invoke-NativeCommand "pnpm" @("lint")
    Invoke-NativeCommand "pnpm" @("typecheck")
    Invoke-NativeCommand "pnpm" @("test")
}

function Get-AiGitMetadata {
    param(
        [Parameter(Mandatory = $true)][string]$Branch,
        [Parameter(Mandatory = $true)][hashtable]$BranchParts,
        [Parameter(Mandatory = $true)][bool]$HasStagedChanges,
        [Parameter(Mandatory = $true)][string]$OutputPath
    )

    Assert-CommandExists "codex"

    $schemaPath = Join-Path $PSScriptRoot "git-workflow-output.schema.json"
    if ($HasStagedChanges) {
        $changeDescription = "the staged diff for the commit message, plus origin/main...HEAD and the staged diff for the full proposed PR"
    }
    else {
        $changeDescription = "origin/main...HEAD for the already-committed change and proposed PR"
    }

    $prompt = @"
Generate Git metadata for a change in this repository.

Context:
- Current branch: $Branch
- Epic: $($BranchParts.Epic)
- Feature: FE-$($BranchParts.Feature)
- Label: $($BranchParts.Label)
- Base branch: origin/main

Inspect AGENTS.md, .github/pull_request_template.md, git status, relevant recent
commits, and $changeDescription. You may run read-only Git and file-inspection commands.
Do not edit files, stage changes, commit, push, or contact GitHub.

Return JSON matching the supplied schema with:
- commitMessage: one Conventional Commit subject, no body, at most 100 characters.
- prTitle: a concise conventional-style title describing the full staged change.
- prBody: complete Markdown using .github/pull_request_template.md exactly as the
  section structure. Replace comments and placeholders with concrete details,
  preserve every checklist item, check only items supported by the change, and
  use "None" where appropriate. Mention FE-$($BranchParts.Feature) in Context.

Base every claim on repository evidence. Do not wrap the JSON in Markdown fences.
"@

    Write-Host "Asking Codex to inspect the proposed change..." -ForegroundColor Cyan
    $prompt | & codex --ask-for-approval never exec --sandbox read-only --ephemeral --color never --cd $script:RepositoryRoot --output-schema $schemaPath --output-last-message $OutputPath - | Out-Host
    $codexExitCode = $LASTEXITCODE
    if ($codexExitCode -ne 0) {
        throw "Codex could not generate the commit and PR metadata. Confirm that Codex is installed and authenticated, then try again."
    }

    try {
        return Get-Content -LiteralPath $OutputPath -Raw | ConvertFrom-Json
    }
    catch {
        throw "Codex returned invalid JSON: $($_.Exception.Message)"
    }
}

function Confirm-CommitMessage {
    param([Parameter(Mandatory = $true)][string]$GeneratedMessage)

    $message = $GeneratedMessage.Trim()
    while ($true) {
        Write-Host "`nProposed commit message:" -ForegroundColor Cyan
        Write-Host "  $message"
        $choice = (Read-Host "[A]ccept, [E]dit, or [Q]uit").Trim().ToLowerInvariant()

        if ($choice -eq "a" -or $choice -eq "accept") {
            return $message
        }

        if ($choice -eq "e" -or $choice -eq "edit") {
            $message = (Read-Host "Commit message").Trim()
            if ([string]::IsNullOrWhiteSpace($message) -or $message.Contains("`n") -or $message.Length -gt 100) {
                Write-Warning "The commit message must be one non-empty line of at most 100 characters."
            }
            else {
                continue
            }
        }

        if ($choice -eq "q" -or $choice -eq "quit") {
            throw "Publish cancelled before the commit was created."
        }
    }
}

function Open-TextEditor {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not [string]::IsNullOrWhiteSpace($env:EDITOR)) {
        & $env:EDITOR $Path
        if ($LASTEXITCODE -ne 0) {
            throw "The configured editor exited with code $LASTEXITCODE."
        }
        return
    }

    Start-Process -FilePath "notepad.exe" -ArgumentList $Path -Wait
}

function Confirm-PullRequest {
    param(
        [Parameter(Mandatory = $true)][string]$GeneratedTitle,
        [Parameter(Mandatory = $true)][string]$BodyPath
    )

    $title = $GeneratedTitle.Trim()
    while ($true) {
        Write-Host "`nProposed PR title:" -ForegroundColor Cyan
        Write-Host "  $title"
        Write-Host "PR body draft: $BodyPath"
        $choice = (Read-Host "[C]ontinue, [E]dit title/body, or [Q]uit").Trim().ToLowerInvariant()

        if ($choice -eq "c" -or $choice -eq "continue") {
            return $title
        }

        if ($choice -eq "e" -or $choice -eq "edit") {
            $editedTitle = (Read-Host "PR title (Enter keeps current)").Trim()
            if (-not [string]::IsNullOrWhiteSpace($editedTitle)) {
                $title = $editedTitle
            }
            Open-TextEditor $BodyPath
            continue
        }

        if ($choice -eq "q" -or $choice -eq "quit") {
            throw "Publish cancelled before any new commit, push, or PR was created."
        }
    }
}

function Start-FeatureBranch {
    if ($Epic -lt 1 -or $Feature -lt 1 -or [string]::IsNullOrWhiteSpace($Label)) {
        throw "start requires -Epic, -Feature, and -Label."
    }

    $normalizedLabel = $Label.Trim().ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $normalizedLabel = $normalizedLabel.Trim('-')
    if ($normalizedLabel -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$') {
        throw "Label must contain letters or numbers and produce a non-empty kebab-case label."
    }

    $branch = "epic-$Epic/fe-$Feature-$normalizedLabel"
    Assert-CleanWorkingTree

    Invoke-NativeCommand "git" @("fetch", "origin", "--prune")
    Invoke-NativeCommand "git" @("switch", "main")
    Invoke-NativeCommand "git" @("pull", "--ff-only", "origin", "main")

    & git show-ref --verify --quiet "refs/heads/$branch"
    if ($LASTEXITCODE -eq 0) {
        throw "Local branch '$branch' already exists. It was preserved; choose another feature or label."
    }

    & git show-ref --verify --quiet "refs/remotes/origin/$branch"
    if ($LASTEXITCODE -eq 0) {
        throw "Remote branch 'origin/$branch' already exists. Choose another feature or resume that branch."
    }

    Invoke-NativeCommand "git" @("switch", "--create", $branch, "origin/main")
    Write-Host "Ready on $branch" -ForegroundColor Green
}

function Show-WorkflowStatus {
    $branch = Get-CurrentBranch
    Write-Host "Branch: $branch" -ForegroundColor Cyan
    Invoke-NativeCommand "git" @("status", "--short", "--branch")

    if ($branch -ne "main" -and $null -ne (Get-Command "gh" -ErrorAction SilentlyContinue)) {
        & gh pr status
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "GitHub PR status could not be loaded."
        }
    }
}

function Publish-FeatureBranch {
    Assert-CommandExists "gh"
    Assert-CommandExists "pnpm"

    $branch = Get-CurrentBranch
    $branchParts = Assert-FeatureBranch $branch

    Invoke-NativeCommand "gh" @("auth", "status")
    Invoke-NativeCommand "git" @("fetch", "origin", "--prune")

    $hasStagedChanges = Test-StagedChanges
    $aheadCountText = (& git rev-list --count "origin/main..HEAD").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to compare the branch with origin/main."
    }
    $aheadCount = [int]$aheadCountText

    if (-not $hasStagedChanges -and $aheadCount -eq 0) {
        throw "No staged or committed feature changes were found. Stage the intended files, review them with 'git diff --cached', and run publish again."
    }

    if (-not $hasStagedChanges) {
        Assert-CleanWorkingTree
        Write-Host "No staged changes found; resuming PR creation from $aheadCount existing branch commit(s)." -ForegroundColor Yellow
    }

    $existingPr = ((& gh pr list --head $branch --state open --json url --jq '.[0].url') -join "").Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to check for an existing pull request."
    }
    if (-not [string]::IsNullOrWhiteSpace($existingPr)) {
        throw "An open pull request already exists for this branch: $existingPr"
    }

    if ($hasStagedChanges) {
        Write-Host "Staged files:" -ForegroundColor Cyan
        Invoke-NativeCommand "git" @("diff", "--cached", "--name-status")
    }
    else {
        Write-Host "Committed files:" -ForegroundColor Cyan
        Invoke-NativeCommand "git" @("diff", "--name-status", "origin/main...HEAD")
    }
    Write-Host "`nWorking tree status:" -ForegroundColor Cyan
    Invoke-NativeCommand "git" @("status", "--short")

    if (-not $SkipChecks) {
        Invoke-Checks
    }
    else {
        Write-Warning "Repository checks were skipped."
    }

    $aiOutputPath = [System.IO.Path]::GetTempFileName()
    $prBodyPath = Join-Path ([System.IO.Path]::GetTempPath()) "pr-$($branch.Replace('/', '-'))-$([guid]::NewGuid().ToString('N')).md"

    try {
        $metadata = Get-AiGitMetadata -Branch $branch -BranchParts $branchParts -HasStagedChanges $hasStagedChanges -OutputPath $aiOutputPath
        Set-Content -LiteralPath $prBodyPath -Value $metadata.prBody -Encoding utf8
        if ($hasStagedChanges) {
            $commitMessage = Confirm-CommitMessage $metadata.commitMessage
        }
        $prTitle = Confirm-PullRequest -GeneratedTitle $metadata.prTitle -BodyPath $prBodyPath

        if ($hasStagedChanges) {
            Invoke-NativeCommand "git" @("commit", "--message", $commitMessage)
        }
        Invoke-NativeCommand "git" @("push", "--set-upstream", "origin", $branch)

        $arguments = @("pr", "create", "--base", "main", "--head", $branch, "--title", $prTitle, "--body-file", $prBodyPath)
        if (-not $Ready) {
            $arguments += "--draft"
        }

        Invoke-NativeCommand "gh" $arguments
    }
    finally {
        Remove-Item -LiteralPath $aiOutputPath -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $prBodyPath -Force -ErrorAction SilentlyContinue
    }
}

function Finish-FeatureBranch {
    Assert-CommandExists "gh"

    $branch = Get-CurrentBranch
    [void](Assert-FeatureBranch $branch)
    Assert-CleanWorkingTree

    $prJson = & gh pr view --json state,mergedAt,url
    if ($LASTEXITCODE -ne 0) {
        throw "No pull request could be found for '$branch'."
    }

    $pr = $prJson | ConvertFrom-Json
    if ($pr.state -ne "MERGED" -or [string]::IsNullOrWhiteSpace($pr.mergedAt)) {
        throw "The pull request has not been merged: $($pr.url)"
    }

    Invoke-NativeCommand "git" @("switch", "main")
    Invoke-NativeCommand "git" @("fetch", "origin", "--prune")
    Invoke-NativeCommand "git" @("pull", "--ff-only", "origin", "main")

    Write-Host "main is current. Local branch '$branch' was preserved." -ForegroundColor Green
}

Push-Location $script:RepositoryRoot
try {
    Assert-CommandExists "git"

    switch ($Command) {
        "start" {
            Start-FeatureBranch
        }
        "check" {
            Invoke-Checks
        }
        "publish" {
            Publish-FeatureBranch
        }
        "status" {
            Show-WorkflowStatus
        }
        "finish" {
            Finish-FeatureBranch
        }
    }
}
finally {
    Pop-Location
}
