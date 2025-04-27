import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string) {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PPpp");
}

export function formatDate(date: Date | string) {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PP");
}

export function formatTime(time: string) {
  if (!time) return "";
  
  // Handle HH:MM:SS format
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12
  const displayMinutes = minutes.toString().padStart(2, "0");
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function truncate(str: string, length: number) {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function calculateLeaveRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "present":
      return "bg-green-100 text-green-800";
    case "absent":
      return "bg-red-100 text-red-800";
    case "half-day":
      return "bg-orange-100 text-orange-800";
    case "late":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function downloadAsExcel(data: any[], filename: string) {
  // In a real application, this would use a library like xlsx
  // For now, create a CSV
  const csvContent = "data:text/csv;charset=utf-8," + 
    Object.keys(data[0]).join(",") + "\n" + 
    data.map(item => Object.values(item).join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAsPDF(elementId: string, filename: string) {
  // In a real application, this would use a library like jspdf
  alert("PDF download functionality would be implemented here");
}
