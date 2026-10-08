import { NavLink } from "react-router-dom";
import Icon, { type IconName } from "../ui/Icon";
import Logo from "../ui/Logo";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/vehicles", label: "Vehículos", icon: "car" },
  { to: "/expenses", label: "Gastos", icon: "receipt" },
  { to: "/profitability", label: "Rentabilidad", icon: "chart" },
  { to: "/archived", label: "Archivados", icon: "archive" },
  { to: "/settings", label: "Configuración", icon: "settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar${open ? " is-open" : ""}`}>
      <div className="sidebar__brand">
        <Logo />
        <div>
          <strong>Concesionario</strong>
          <span>Inventario y rentabilidad</span>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
