export const tableCustomStyles = {
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
      fontSize: "10px",
      fontWeight: "600",
      textTransform: "uppercase" as const,
      paddingLeft: "12px",
      paddingRight: "12px",
    },
  },
  rows: {
    style: {
      minHeight: "68px",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-light)",
      "&:hover": {
        backgroundColor: "var(--bg-surface-hover)",
        transition: "background-color 0.15s ease",
      },
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      color: "var(--text-primary)",
      fontSize: "12px",
    },
  },
  pagination: {
    style: {
      minHeight: "44px",
      borderTop: "1px solid var(--border-light)",
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-muted)",
      fontSize: "10px",
    },
    pageButtonsStyle: {
      fill: "var(--text-muted)",
      "&:disabled": {
        fill: "var(--border-hover)",
      },
      "&:hover:not(:disabled)": {
        backgroundColor: "var(--bg-surface-hover)",
      },
    },
  },
}
