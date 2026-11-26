import { CardContent, CheckIcon, MinusIcon } from "@template/ui-core";
import { Fragment } from "react";
import { isPermissionGranted, type AdminPermissionMatrix } from "./roles-model";

// Reference matrix: sentence-case column headers, uppercase group rows.
const headerCell =
  "border-border bg-surface-2 text-caption text-fg-muted border-b py-3 font-semibold";

/**
 * Read-only role × permission table (reference "Permission matrix"). Each
 * cell states "Granted" or "Not granted" in text; the marks are decorative.
 * The catalogue is whatever the source supplies — never a built-in list.
 *
 * This is deliberately not `DataTable`: a matrix needs row headers
 * (`<th scope="row">` per permission) and group headings spanning every
 * role column (`scope="colgroup"`), which `DataTable`'s column/cell model
 * does not express. Screen readers announce "permission, role: Granted"
 * from these headers. It keeps `DataTable`'s visual tokens and scrolls
 * horizontally on phones inside a focusable, labelled region.
 */
export function PermissionMatrix({
  matrix,
}: Readonly<{ matrix: AdminPermissionMatrix }>) {
  if (matrix.groups.length === 0 || matrix.roles.length === 0) {
    return (
      <CardContent>
        <p className="text-fg-muted">No permissions reported.</p>
      </CardContent>
    );
  }
  return (
    <div
      aria-label="Permission matrix"
      className="overflow-x-auto"
      role="region"
      tabIndex={0}
    >
      <table className="text-label w-full min-w-[640px] border-collapse font-normal">
        <caption className="sr-only">
          Permissions granted to each role (read-only)
        </caption>
        <thead>
          <tr>
            <th className={`${headerCell} px-6 text-left`} scope="col">
              Permission
            </th>
            {matrix.roles.map((role) => (
              <th
                className={`${headerCell} px-3 text-center`}
                key={role.id}
                scope="col"
              >
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.groups.map((group) => (
            <Fragment key={group.id}>
              <tr>
                <th
                  className="border-border bg-surface-2 text-caption text-fg-subtle border-b px-6 py-2.5 text-left font-semibold tracking-[0.04em] uppercase"
                  colSpan={matrix.roles.length + 1}
                  scope="colgroup"
                >
                  {group.label}
                </th>
              </tr>
              {group.permissions.map((permission) => (
                <tr key={permission.key}>
                  <th
                    className="border-border text-fg border-b px-6 py-3 text-left font-medium"
                    scope="row"
                  >
                    {permission.label}
                    <span className="text-caption text-fg-subtle block font-mono font-normal">
                      {permission.key}
                    </span>
                  </th>
                  {matrix.roles.map((role) => {
                    const granted = isPermissionGranted(
                      matrix,
                      role.id,
                      permission.key,
                    );
                    return (
                      <td
                        className="border-border border-b px-3 py-3 text-center"
                        data-granted={granted}
                        key={role.id}
                      >
                        {granted ? (
                          <CheckIcon
                            className="text-success inline"
                            size="sm"
                          />
                        ) : (
                          <MinusIcon
                            className="text-fg-subtle inline"
                            size="sm"
                          />
                        )}
                        <span className="sr-only">
                          {granted ? "Granted" : "Not granted"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
