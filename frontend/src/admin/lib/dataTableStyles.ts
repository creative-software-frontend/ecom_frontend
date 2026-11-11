import type { TableStyles } from "react-data-table-component"

/* ================================================================
   Shared react-data-table-component styling — every value uses a
   CSS variable so theme changes in admin.css propagate here.
   Reused across Users / Roles / Shops / Audit tables.
   ================================================================ */

export const adminDataTableStyles: TableStyles = {
  table: {
    style: {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-primary)",
    },
  },
  headRow: {
    style: {
      minHeight: "38px",
      backgroundColor: "var(--bg-table-header)",
      borderBottom: "1px solid var(--border-light)",
    },
  },
  headCells: {
    style: {
      color: "var(--text-muted)",
      fontSize: "11px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      paddingLeft: "12px",
      paddingRight: "12px",
    },
  },
  rows: {
    style: {
      minHeight: "52px",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-light)",
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      color: "var(--text-primary)",
      fontSize: "13px",
    },
  },
  pagination: {
    style: {
      minHeight: "48px",
      borderTop: "1px solid var(--border-light)",
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-muted)",
      fontSize: "12px",
    },
    pageButtonsStyle: {
      fill: "var(--text-muted)",
    },
  },
  progress: {
    style: {
      backgroundColor: "var(--bg-surface)",
    },
  },
  noData: {
    style: {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-muted)",
    },
  },
}
