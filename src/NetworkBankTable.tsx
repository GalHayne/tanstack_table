import * as React from "react";
import {flexRender,getCoreRowModel,useReactTable} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { NetworkBankRow } from "./mockNetworkBank";

const DASH = "—";

function formatFreq(row: NetworkBankRow): string {
  // Rule 1: center exists -> show center
  if (row.centerFrequency !== null) return String(row.centerFrequency);

  // Rule 2: otherwise take first-last and (size)
  const arr = row.frequenciesMhz;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    const last = arr[arr.length - 1];
    return `${first}–${last} (${arr.length})`;
  }

  // Rule 3: missing
  return DASH;
}

function formatDate(iso: string | null): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  // simple readable local format
  return d.toLocaleString();
}

export function NetworkBankTable({
  data,
  dense = true,
}: {
  data: NetworkBankRow[];
  dense?: boolean;
}) {
  const columns = React.useMemo<ColumnDef<NetworkBankRow>[]>(
    () => [
      { header: "Network ID", accessorKey: "knowNetworkId" },
      { header: "Priority", accessorKey: "comintPriority" },
      { header: "TX Type", accessorKey: "txType" },

      // Computed column (Freq)
      {
        id: "freq",
        header: "Freq (MHz)",
        cell: ({ row }) => formatFreq(row.original),
      },

      { header: "Hop Rate", accessorKey: "hopRate" },
      { header: "Bandwidth (kHz)", accessorKey: "bandwidthKhz" },
      { header: "Modulation", accessorKey: "modulation" },
      { header: "Speech Type", accessorKey: "speechType" },
      { header: "Network Name", accessorKey: "networkName" },
      { header: "Traffic Type", accessorKey: "trafficType" },
      {
        id: "lastInterceptionTime",
        header: "Last Interception",
        cell: ({ row }) => formatDate(row.original.lastInterceptionTime),
      },
      {
        id: "jammingTarget",
        header: "Jamming",
        cell: ({ row }) => (row.original.jammingTarget ? "Yes" : "No"),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const fontSize = dense ? 12 : 14;
  const cellPy = dense ? 0.75 : 1.25;

  return (
    <TableContainer component={Paper} elevation={1}>
      <Typography sx={{ p: 1.5 }} variant="subtitle1">
        Network Bank
      </Typography>

      <Table size={dense ? "small" : "medium"} stickyHeader>
        <TableHead>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    fontWeight: 700,
                    fontSize,
                    py: cellPy,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>

        <TableBody>
          {table.getRowModel().rows.map((r) => (
            <TableRow key={r.id} hover>
              {r.getVisibleCells().map((cell) => {
                const value = cell.getValue();
                const isNullish = value === null || value === undefined;

                const renderer = cell.column.columnDef.cell;

                return (
                  <TableCell
                    key={cell.id}
                    sx={{
                      fontSize,
                      py: cellPy,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cell.column.id === "freq" ||
                    cell.column.id === "lastInterceptionTime" ||
                    cell.column.id === "jammingTarget" ? (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : isNullish ? (
                      DASH
                    ) : (
                      flexRender(renderer, cell.getContext())
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}