import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleAlert,
  CircleHelp,
  CircleX,
  Clock,
  Copy,
  CreditCard,
  Database,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Fingerprint,
  Globe,
  History,
  House,
  Inbox,
  Info,
  KeyRound,
  Laptop,
  LayoutGrid,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  Monitor,
  Moon,
  PanelLeft,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Upload,
  User,
  Users,
  Wallet,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";

/*
 * Shared icon set: a curated selection of Lucide icons (TD-05), whose 24px
 * grid and round caps match the reference. Import icons from here, not from
 * `lucide-react`, so every icon gets the same stroke and accessibility
 * defaults and the set stays reviewable.
 *
 * Icons are always decorative (`aria-hidden`): adjacent text or the
 * `aria-label` of the surrounding control carries the meaning. An icon-only
 * control must therefore have an accessible name (see `IconButton`).
 *
 * Size: 20px by default (an SVG attribute, so any `className` size wins), or a
 * reference preset via `size` — `xs` 16px inline, `sm` 18px buttons, `md` 20px
 * navigation and icon buttons, `lg` 22px mobile tab bar. Colour follows
 * `currentColor`.
 */

export type IconSize = "xs" | "sm" | "md" | "lg";

export type IconProps = Readonly<{ className?: string; size?: IconSize }>;

export type IconComponent = ((props: IconProps) => ReactElement) & {
  displayName?: string;
};

const iconSizeClasses: Record<IconSize, string> = {
  xs: "size-icon-xs",
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
};

/** Reference stroke width for 24px outline icons. */
const ICON_STROKE_WIDTH = 1.8;

function createIcon(Glyph: LucideIcon, name: string): IconComponent {
  function Icon({ className, size }: IconProps) {
    return (
      <Glyph
        aria-hidden="true"
        className={cn("shrink-0", size && iconSizeClasses[size], className)}
        data-icon={name}
        focusable="false"
        height={20}
        strokeWidth={ICON_STROKE_WIDTH}
        width={20}
      />
    );
  }
  Icon.displayName = name;
  return Icon;
}

// Navigation and account. Names predate the Lucide migration and are kept so
// existing consumers compile unchanged.
export const HomeIcon = createIcon(House, "HomeIcon");
export const GridIcon = createIcon(LayoutGrid, "GridIcon");
export const UserIcon = createIcon(User, "UserIcon");
export const UsersIcon = createIcon(Users, "UsersIcon");
export const ShieldIcon = createIcon(Shield, "ShieldIcon");
export const ShieldCheckIcon = createIcon(ShieldCheck, "ShieldCheckIcon");
export const CreditCardIcon = createIcon(CreditCard, "CreditCardIcon");
export const WalletIcon = createIcon(Wallet, "WalletIcon");
export const SettingsIcon = createIcon(Settings, "SettingsIcon");
export const KeyIcon = createIcon(KeyRound, "KeyIcon");
export const LockIcon = createIcon(Lock, "LockIcon");
export const FingerprintIcon = createIcon(Fingerprint, "FingerprintIcon");
export const SmartphoneIcon = createIcon(Smartphone, "SmartphoneIcon");
export const LaptopIcon = createIcon(Laptop, "LaptopIcon");
export const MonitorIcon = createIcon(Monitor, "MonitorIcon");
export const GlobeIcon = createIcon(Globe, "GlobeIcon");
export const MapPinIcon = createIcon(MapPin, "MapPinIcon");
export const ClockIcon = createIcon(Clock, "ClockIcon");
export const HistoryIcon = createIcon(History, "HistoryIcon");
export const WifiIcon = createIcon(Wifi, "WifiIcon");
export const ActivityIcon = createIcon(Activity, "ActivityIcon");
export const DatabaseIcon = createIcon(Database, "DatabaseIcon");
export const LogOutIcon = createIcon(LogOut, "LogOutIcon");
export const MailIcon = createIcon(Mail, "MailIcon");
export const BellIcon = createIcon(Bell, "BellIcon");
export const CalendarIcon = createIcon(Calendar, "CalendarIcon");
export const FileTextIcon = createIcon(FileText, "FileTextIcon");

// Status.
export const CircleCheckIcon = createIcon(CircleCheck, "CircleCheckIcon");
export const CircleAlertIcon = createIcon(CircleAlert, "CircleAlertIcon");
export const CircleXIcon = createIcon(CircleX, "CircleXIcon");
export const TriangleAlertIcon = createIcon(TriangleAlert, "TriangleAlertIcon");
export const InfoIcon = createIcon(Info, "InfoIcon");
export const CircleHelpIcon = createIcon(CircleHelp, "CircleHelpIcon");
export const InboxIcon = createIcon(Inbox, "InboxIcon");
export const LoaderIcon = createIcon(LoaderCircle, "LoaderIcon");
export const TrendingUpIcon = createIcon(TrendingUp, "TrendingUpIcon");
export const TrendingDownIcon = createIcon(TrendingDown, "TrendingDownIcon");

// Actions and controls.
export const RefreshIcon = createIcon(RefreshCw, "RefreshIcon");
export const SearchIcon = createIcon(Search, "SearchIcon");
export const FilterIcon = createIcon(Filter, "FilterIcon");
export const EyeIcon = createIcon(Eye, "EyeIcon");
export const EyeOffIcon = createIcon(EyeOff, "EyeOffIcon");
export const CopyIcon = createIcon(Copy, "CopyIcon");
export const PencilIcon = createIcon(Pencil, "PencilIcon");
export const TrashIcon = createIcon(Trash2, "TrashIcon");
export const PlusIcon = createIcon(Plus, "PlusIcon");
export const MinusIcon = createIcon(Minus, "MinusIcon");
export const CheckIcon = createIcon(Check, "CheckIcon");
export const CloseIcon = createIcon(X, "CloseIcon");
export const MoreIcon = createIcon(Ellipsis, "MoreIcon");
export const UploadIcon = createIcon(Upload, "UploadIcon");
export const DownloadIcon = createIcon(Download, "DownloadIcon");
export const PrinterIcon = createIcon(Printer, "PrinterIcon");
export const ExternalLinkIcon = createIcon(ExternalLink, "ExternalLinkIcon");
export const ArrowLeftIcon = createIcon(ArrowLeft, "ArrowLeftIcon");
export const ArrowRightIcon = createIcon(ArrowRight, "ArrowRightIcon");

// Chrome.
export const SunIcon = createIcon(Sun, "SunIcon");
export const MoonIcon = createIcon(Moon, "MoonIcon");
export const MenuIcon = createIcon(Menu, "MenuIcon");
export const PanelLeftIcon = createIcon(PanelLeft, "PanelLeftIcon");
export const ChevronDownIcon = createIcon(ChevronDown, "ChevronDownIcon");
export const ChevronUpIcon = createIcon(ChevronUp, "ChevronUpIcon");
export const ChevronLeftIcon = createIcon(ChevronLeft, "ChevronLeftIcon");
export const ChevronRightIcon = createIcon(ChevronRight, "ChevronRightIcon");
