import * as React from "react";
import {flexRender,getCoreRowModel,useReactTable} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { NetworkBankRow } from "./mockNetworkBank";

const DASH = "—";

function formatFreq(row: NetworkBankRow): string {
  if (row.centerFrequency !== null) return String(row.centerFrequency);

  const arr = row.frequenciesMhz;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    const last = arr[arr.length - 1];
    return `${first}–${last} (${arr.length})`;
  }

  return DASH;
}

function formatDate(iso: string | null): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleString();
}

export function NetworkBankTable({
  data,
  dense = true,
  height = 600,
}: {
  data: NetworkBankRow[];
  dense?: boolean;
  height?: number;
}) {
  const columns = React.useMemo<ColumnDef<NetworkBankRow>[]>(
    () => [
      { header: "Network ID", accessorKey: "knowNetworkId" },
      { header: "Priority", accessorKey: "comintPriority" },
      { header: "TX Type", accessorKey: "txType" },
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

  const rows = table.getRowModel().rows;

  // Density / sizing
  const fontSize = dense ? 12 : 14;
  const cellPy = dense ? 0.75 : 1.25;
  const rowHeight = dense ? 36 : 44; // estimate for virtualizer

  // Scroll container ref
  const parentRef = React.useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <Paper elevation={1}>
      <Typography sx={{ p: 1.5 }} variant="subtitle1">
        Network Bank
      </Typography>

      {/* Scroll container */}
      <TableContainer
        ref={parentRef}
        sx={{
          height,
          overflow: "auto",
        }}
      >
        <Table stickyHeader size={dense ? "small" : "medium"}>
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
                      bgcolor: "background.paper",
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

          {/* Virtualized "body" as divs (to allow absolute positioning) */}
          <Box
            component="tbody"
            sx={{
              display: "block",
              position: "relative",
              height: totalSize,
            }}
          >
            {virtualItems.map((vi) => {
              const row = rows[vi.index];

              return (
                <TableRow
                  key={row.id}
                  component="div"
                  hover
                  sx={{
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const value = cell.getValue();
                    const renderer = cell.column.columnDef.cell;

                    return (
                      <TableCell
                        key={cell.id}
                        component="div"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          fontSize,
                          py: cellPy,
                          whiteSpace: "nowrap",
                          // IMPORTANT: to avoid columns collapsing when using flex rows
                          flex: 1,
                          minWidth: 120,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {renderer
                          ? flexRender(renderer, cell.getContext())
                          : value === null || value === undefined
                            ? DASH
                            : String(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </Box>
        </Table>
      </TableContainer>
    </Paper>
  );
}