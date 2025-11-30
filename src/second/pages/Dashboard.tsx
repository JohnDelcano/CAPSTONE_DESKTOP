import { useEffect, useState } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ------------------- Types -------------------
interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  status?: string;
}

interface Book {
  title: string;
  availableCount?: number;
  borrowedCount?: number;
  reservedCount?: number;
}

interface Reservation {
  _id: string;
  status: string;
  reservedAt?: string;
  dueDate?: string;
  studentId?: Student;
  bookId?: Book;
}

interface Stats {
  totalStudents: number;
  totalBooks: number;
  booksBorrowed: number;
  overdueBooks: number;
}

interface MonthlyStat {
  month: string;
  borrowed: number;
  returned: number;
}

// ------------------- Component -------------------
export default function Dashboard() {
  const API_BASE = "https://api-backend-urlr.onrender.com/api";

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalBooks: 0,
    booksBorrowed: 0,
    overdueBooks: 0,
  });

  const [reportData, setReportData] = useState<MonthlyStat[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // ------------------- Fetch Dashboard Data -------------------
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [studentsRes, booksRes, reservationsRes] = await Promise.all([
        axios.get<{ data: Student[] }>(`${API_BASE}/students`, { headers }),
        axios.get<Book[]>(`${API_BASE}/books`, { headers }),
        axios.get<{ reservations: Reservation[] }>(`${API_BASE}/reservation/admin/all`, { headers }),
      ]);

      const students = studentsRes.data?.data || [];
      const books = booksRes.data || [];
      const reservations = reservationsRes.data?.reservations || [];

      const totalBooks = books.length;
      const booksBorrowed = reservations.filter(
        r => r.status === "approved" || r.status === "completed"
      ).length;
      const overdueBooks = reservations.filter(
        r => r.status === "approved" && r.dueDate && new Date(r.dueDate) < new Date()
      ).length;

      setStats({ totalStudents: students.length, totalBooks, booksBorrowed, overdueBooks });

      const monthlyStats: Record<string, { borrowed: number; returned: number }> = {};

      reservations.forEach((r) => {
        const reservedDate = r.reservedAt || r.dueDate;
        if (!reservedDate) return;

        const month = new Date(reservedDate).toLocaleString("default", { month: "short" });
        if (!monthlyStats[month]) monthlyStats[month] = { borrowed: 0, returned: 0 };

        if (r.status === "approved") monthlyStats[month].borrowed++;
        if (["returned", "completed"].includes(r.status)) monthlyStats[month].returned++;
      });

      setReportData(
        Object.entries(monthlyStats).map(([month, data]) => ({ month, ...data }))
      );
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    }
  };

  // ------------------- Download Report -------------------
  const downloadReport = async () => {
    try {
      setLoadingReport(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/adminReports/report/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("❌ Error downloading report:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  // ------------------- Socket Integration -------------------
  useEffect(() => {
    const socket: Socket = io(API_BASE);

    const updateHandler = () => fetchDashboardData();
    socket.on("bookStatusUpdated", updateHandler);
    socket.on("reservationCreated", updateHandler);
    socket.on("reservationUpdated", updateHandler);
    socket.on("bookReturned", updateHandler);

    return () => {
      socket.disconnect();
    };
  }, []);

  // ------------------- Initial fetch + interval fallback -------------------
  useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // ------------------- Render -------------------
  return (
    <div className="flex-1 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm opacity-80">Overview of library activity</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <img src="/src/assets/bell.png" alt="Notifications" className="w-7 h-7" />
        </div> */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Total Students", value: stats.totalStudents, color: "bg-blue-500" },
          { title: "Total Books", value: stats.totalBooks, color: "bg-green-500" },
          { title: "Books Borrowed", value: stats.booksBorrowed, color: "bg-yellow-500" },
          { title: "Overdue Books", value: stats.overdueBooks, color: "bg-red-500" },
        ].map(stat => (
          <div key={stat.title} className={`p-4 rounded-xl shadow-lg text-white ${stat.color}`}>
            <h3 className="text-sm opacity-80">{stat.title}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Report Button */}
      <div className="mb-6">
        <button
          onClick={downloadReport}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          disabled={loadingReport}
        >
          {loadingReport ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* Chart */}
      <div className="p-6 bg-white rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">Statistic Report</h3>
        <p className="text-gray-500 mb-6">Monthly overview of borrowed and returned books</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="borrowed" fill="#3B82F6" name="Books Borrowed" />
            <Bar dataKey="returned" fill="#10B981" name="Books Returned" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
