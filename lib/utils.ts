import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTime = (timeString: {
  split: (arg0: string) => [any, any];
}) => {
  const [hour, minute] = timeString.split(":");
  const hourInt = parseInt(hour, 10);
  const period = hourInt >= 12 ? "PM" : "AM";
  const formattedHour =
    hourInt > 12 ? hourInt - 12 : hourInt === 0 ? 12 : hourInt;

  return `${formattedHour}:${minute} ${period}`;
};

// export const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
// }
export const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "dd, MMMM yyyy");
};
export const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "dd, MMMM yyyy, hh:mm a");
};
export const formatCurrency = (amount: number): string => {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formattedAmount.replace("BDT", "৳");
};

export const getDateString = (date: Date) => {
  const dateString =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    "T" +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2) +
    "." +
    ("00" + date.getMilliseconds()).slice(-3) +
    "Z";
  return dateString;
};

export const formatDateAndTimeSimple = (dateString: string) => {
  if (!dateString) return "N/A";
  return format(new Date(dateString), "dd-mm-yyyy, hh:mm a");
};
