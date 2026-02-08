import * as React from "react";
import type { SortingState } from "@tanstack/react-table";
import { getSortedRowModel } from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
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
const FIXED_TABLE_WIDTH = 1020;

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

function formatDateShort(iso: string | null): string {
    if (!iso) return DASH;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return DASH;

    // Short + stable display (local)
    // yyyy-mm-dd hh:mm
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function last4(id: string): string {
    if (!id) return DASH;
    return id.slice(-4);
}

/**
 * Fixed column widths (px).
 * You can tweak these later after you see it on screen.
 */
const COL_W = {
    id: 20,
    p: 15,
    tx: 30,
    freq: 70,
    hop: 80,
    bw: 50,
    modulation: 50,
    speech: 70,
    name: 40,
    traffic: 55,
    ltoi: 90,
    jam: 50,
} as const;

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
            // 1) NetworkId --> Id , cell only last 4 chars
            {
                id: "id",
                header: "Id",
                accessorKey: "knowNetworkId",
                cell: ({ getValue }) => last4(String(getValue() ?? "")),
            },

            // 2) Priority --> P
            { id: "p", header: "P", accessorKey: "comintPriority" },

            // 3) Without change (TX Type)
            { id: "tx", header: "TX Type", accessorKey: "txType" },

            // 4) Freq (MHz)
          {
                id: "freq",
                header: "Freq (MHz)",
                accessorFn: (row) => {
                    return row.centerFrequency ?? (row.frequenciesMhz?.[0] ?? null);
                },
                cell: ({ row }) => formatFreq(row.original),
                sortingFn: (a, b, columnId) => {
                    const av = a.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY;
                    const bv = b.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY;
                    return av - bv;
                },
            },

            // 5) Hop Rate(#/sec)
            {
                id: "hop",
                header: "Hop Rate (#/sec)",
                accessorKey: "hopRate",
            },

            // 6) BW (kHz)
            {
                id: "bw",
                header: "BW (kHz)",
                accessorKey: "bandwidthKhz",
            },

            // 7) Without change (Modulation)
            {
                id: "modulation",
                header: "Modulation",
                accessorKey: "modulation",
            },

            // 8) Without change (Speech Type)
            {
                id: "speech",
                header: "Speech Type",
                accessorKey: "speechType",
            },

            // 9) Network Name -- Name
            {
                id: "name",
                header: "Name",
                accessorKey: "networkName",
            },

            // 10) Without change (Traffic Type)
            {
                id: "traffic",
                header: "Traffic Type",
                accessorKey: "trafficType",
            },

            // 11) Last Interception --> LTOI
            {
                id: "ltoi",
                header: "LTOI",
                accessorFn: (row) => (row.lastInterceptionTime ? Date.parse(row.lastInterceptionTime) : null),
                cell: ({ row }) => formatDateShort(row.original.lastInterceptionTime),
                sortingFn: (a, b, columnId) => {
                    const av = a.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY;
                    const bv = b.getValue<number | null>(columnId) ?? Number.NEGATIVE_INFINITY;
                    return av - bv;
                },
            },

            // 12) Jamming --> Jam Tar.
            {
                id: "jam",
                header: "Jam Tar.",
                cell: ({ row }) => (row.original.jammingTarget ? "Yes" : "No"),
                sortingFn: "basic",
                accessorFn: (row) => {
                    return row.jammingTarget
                },
            }
        ],
        []
    );

    const [sorting, setSorting] = React.useState<SortingState>([]);

    
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),

    });
    const rows = table.getRowModel().rows;

    // Density / sizing
    const fontSize = dense ? 12 : 14;
    const cellPy = dense ? 0.5 : 1;
    const rowHeight = dense ? 34 : 42;

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

    // Total fixed width for the table (sum of all cols)
    const tableWidth =
        COL_W.id +
        COL_W.p +
        COL_W.tx +
        COL_W.freq +
        COL_W.hop +
        COL_W.bw +
        COL_W.modulation +
        COL_W.speech +
        COL_W.name +
        COL_W.traffic +
        COL_W.ltoi +
        COL_W.jam;

    return (
        <Paper elevation={1}>
            <Typography sx={{ p: 1.5 }} variant="subtitle1">
                Network Bank
            </Typography>

            <TableContainer
                ref={parentRef}
                sx={{
                    height,
                    overflow: "auto",
                    width: FIXED_TABLE_WIDTH,
                }}
            >
                <Table
                    stickyHeader
                    size={dense ? "small" : "medium"}
                    sx={{
                        // We force a fixed layout width so the header aligns with virtual rows
                        width: tableWidth,
                        tableLayout: "fixed",
                    }}
                >
                    <TableHead>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => {
                                    const id = header.column.id as keyof typeof COL_W;
                                    const canSort = header.column.getCanSort();

                                    console.log(header.column.id, "canSort:", header.column.getCanSort());

                                    return (
                                        <TableCell
                                            align="center"
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                            key={header.id}
                                            sx={{
                                                cursor: header.column.getCanSort() ? "pointer" : "default",
                                                userSelect: "none",
                                                width: COL_W[id] ?? 120,
                                                minWidth: COL_W[id] ?? 120,
                                                maxWidth: COL_W[id] ?? 120,
                                                fontWeight: 700,
                                                fontSize,
                                                textAlign: "center",
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
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHead>

                    {/* Virtualized body as divs */}
                    <Box
                        component="tbody"
                        sx={{
                            display: "block",
                            position: "relative",
                            height: totalSize,
                            width: tableWidth,
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
                                        transform: `translateY(${vi.start}px)`,
                                        width: tableWidth,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const colId = cell.column.id as keyof typeof COL_W;
                                        const w = COL_W[colId] ?? 120;

                                        const value = cell.getValue();
                                        const renderer = cell.column.columnDef.cell;

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                component="div"
                                                sx={{
                                                    width: w,
                                                    minWidth: w,
                                                    maxWidth: w,
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    textAlign: "center",
                                                    alignItems: "center",
                                                    fontSize,
                                                    py: cellPy,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
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