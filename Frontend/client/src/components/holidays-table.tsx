import { useEffect, useState } from "react";
import { useHolidayStore} from "@/stores/holiday-store";
import { Holiday } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { v4 as uuid } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function HolidayTable() {
  const { holidays, setHolidays } = useHolidayStore();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const itemsPerPage = 8;

  const filtered = holidays.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setSelectedHoliday(null);
    setIsFormOpen(false);
  };

  const saveHoliday = () => {
    if (!selectedHoliday) return;

    const isEdit = holidays.some((h) => h.id === selectedHoliday.id);
    const updated = isEdit
      ? holidays.map((h) => (h.id === selectedHoliday.id ? selectedHoliday : h))
      : [...holidays, { ...selectedHoliday, id: uuid() }];

    setHolidays(updated);
    resetForm();
  };

  const confirmDelete = () => {
    if (selectedHoliday) {
      setHolidays(holidays.filter((h) => h.id !== selectedHoliday.id));
      setIsDeleteOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
          <CardDescription>
            Manage National and Company holidays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4 justify-between">
            <Input
              placeholder="Search holidays..."
              className="max-w-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Button
              onClick={() => {
                setSelectedHoliday({
                  id: uuid(),
                  name: "",
                  date: new Date(),
                  type: "national",
                });
                setIsFormOpen(true);
              }}
            >
              Add Holiday
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length > 0 ? (
                  paginated.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">
                        {holiday.name}
                      </TableCell>
                      <TableCell>
                        {format(holiday.date, "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell>
                        <span className={`capitalize`}>{holiday.type}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedHoliday(holiday);
                                setIsFormOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedHoliday(holiday);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-gray-500"
                    >
                      No holidays found{search && " matching search"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-end mt-4 gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Holiday Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedHoliday?.id ? "Edit Holiday" : "Add Holiday"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Holiday Name"
              value={selectedHoliday?.name || ""}
              onChange={(e) =>
                setSelectedHoliday(
                  (prev: Holiday | null) => prev && { ...prev, name: e.target.value }
                )
              }
            />
            <Input
              type="date"
              value={selectedHoliday ? selectedHoliday.date.toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                setSelectedHoliday(
                  (prev: Holiday | null) =>
                    prev && {
                      ...prev,
                      date: new Date(e.target.value),
                    }
                )
              }
            />
            <Select
              value={selectedHoliday?.type}
              onValueChange={(val) =>
                setSelectedHoliday(
                  (prev: Holiday | null) => prev && { ...prev, type: val as Holiday["type"] }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="religious">Religious</SelectItem>
                <SelectItem value="observance">Observance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={saveHoliday} disabled={!selectedHoliday?.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Holiday</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedHoliday?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
