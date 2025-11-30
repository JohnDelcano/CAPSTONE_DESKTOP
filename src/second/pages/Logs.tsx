import { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import dayjs from "dayjs";
import { socket } from "../../api/socket";

function Badge({ color, text }: { color: string; text: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-700",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorMap[color]}`}>{text}</span>;
}

interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
}

interface PrintHistoryEntry {
  quantity: number;
  date: string;
}

interface LogEntry {
  _id: string;
  studentId: string;
  studentName: string;
  timeIn: string;
  timeOut?: string;
  status: "Checked In" | "Checked Out" | "Pending";
  printCount: number;
  lastPrintedAt?: string;
  printHistory: PrintHistoryEntry[];
  alreadyPrinted?: boolean;
  tempPrintQuantity?: number;
}

interface LogFromAPI {
  _id: string;
  student: Student;
  timeIn: string;
  timeOut?: string;
  status: string;
  printCount: number;
  lastPrintedAt?: string;
  printHistory: PrintHistoryEntry[];
}

interface SocketLogData {
  type: "timein" | "timeout" | "print";
  log: LogFromAPI;
}

const API_BASE = "https://api-backend-urlr.onrender.com";

export default function Logs() {
  const [studentId, setStudentId] = useState("2025-");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Format backend log to frontend structure
  const formatLog = (log: LogFromAPI & { alreadyPrinted?: boolean }): LogEntry => ({
  _id: log._id,
  studentId: log.student?.studentId ?? "N/A",
  studentName: log.student
    ? `${log.student.firstName} ${log.student.lastName}`
    : "Unknown Student",
  timeIn: dayjs(log.timeIn).format("YYYY-MM-DD HH:mm:ss"),
  timeOut: log.timeOut ? dayjs(log.timeOut).format("YYYY-MM-DD HH:mm:ss") : undefined,
  status: log.status === "Checked In" ? "Checked In" : log.status === "Checked Out" ? "Checked Out" : "Pending",
  printCount: log.printCount ?? 0,
  lastPrintedAt: log.lastPrintedAt,
  printHistory: log.printHistory ?? [],
  alreadyPrinted: log.alreadyPrinted ?? false, // use backend flag
  tempPrintQuantity: 0,
});


  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ success: boolean; data: LogFromAPI[] }>(`${API_BASE}/api/logs`);
      setLogs(res.data.data.map(formatLog));
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to fetch logs" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  // 1️⃣ Fetch initial logs
  fetchLogs();

  // 2️⃣ Handle socket updates
  const handleLogUpdated = (data: SocketLogData) => {
    const updatedLog = formatLog(data.log);
    setLogs(prev => {
      const exists = prev.find(l => l._id === updatedLog._id);
      if (exists) {
        return prev.map(l => (l._id === updatedLog._id ? updatedLog : l));
      }
      return [updatedLog, ...prev];
    });
  };

  socket.on("logUpdated", handleLogUpdated);

  // 3️⃣ Cleanup
  return () => {
    socket.off("logUpdated", handleLogUpdated);
  };
}, [fetchLogs]);


  const handleTimeIn = async () => {
    if (!studentId.trim()) {
      setMessage({ type: "error", text: "Enter a valid student ID" });
      return;
    }

    setActionLoading("timeIn");
    setMessage(null);

    try {
      await axios.post(`${API_BASE}/api/logs/timein`, { studentId });
      setMessage({ type: "success", text: `${studentId} has successfully timed in.` });
      setStudentId("2025-");
      // ❌ Do NOT add to logs manually; socket will handle it
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to log time in" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTimeOut = async (log: LogEntry) => {
    setActionLoading(log._id);
    setMessage(null);

    try {
      const res = await axios.post(`${API_BASE}/api/logs/timeout`, {
        logId: log._id,
        printCount: !log.alreadyPrinted && log.tempPrintQuantity ? log.tempPrintQuantity : undefined,
      });

      // Update log in state
      const updated = formatLog(res.data.log);
      setLogs(prev => prev.map(l => (l._id === updated._id ? updated : l)));

      setMessage({ type: "success", text: `${updated.studentName} has timed out.` });
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to log time out" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Checked In": return "yellow";
      case "Checked Out": return "green";
      case "Pending": return "blue";
      default: return "gray";
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (!a.timeOut && b.timeOut) return -1;
    if (a.timeOut && !b.timeOut) return 1;
    return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime();
  });

  return (
    <div className="flex-1 p-4">
      {message && <div className={`mb-4 p-2 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{message.text}</div>}

      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTimeIn()}
          className="border p-2 rounded w-64"
          disabled={actionLoading === "timeIn"}
        />
        <button
          onClick={handleTimeIn}
          disabled={actionLoading === "timeIn"}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {actionLoading === "timeIn" ? "Processing..." : "Time In"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-[#D9D9D9] rounded-md border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left text-[#D9D9D9] bg-[#43435E]">
              <th className="p-3">Student ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Time In</th>
              <th className="p-2">Time Out</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-center">No. of Prints</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log) => (
              <tr key={log._id} className={`shadow-sm ${log.status === "Checked Out" ? "bg-green-50" : "bg-white"}`}>
                <td className="p-2 border-y border-gray-300">{log.studentId}</td>
                <td className="p-2 border-y border-gray-300">{log.studentName}</td>
                <td className="p-2 border-y border-gray-300">{log.timeIn}</td>
                <td className="p-2 border-y border-gray-300">{log.timeOut || "-"}</td>
                <td className="p-2 border-y border-gray-300">
                  <Badge color={getStatusColor(log.status)} text={log.status} />
                </td>
                <td className="p-2 border-y border-gray-300 text-center">
                  {!log.alreadyPrinted && !log.timeOut ? (
                    <input
                      type="number"
                      min={1}
                      value={log.tempPrintQuantity}
                      onChange={(e) =>
                        setLogs(prev => prev.map(l => l._id === log._id ? { ...l, tempPrintQuantity: parseInt(e.target.value) } : l))
                      }
                      className="w-16 p-1 border rounded text-sm"
                    />
                  ) : log.printCount > 0 ? (
                    <span className="text-green-600 font-medium">{log.printCount}</span>
                  ) : (
                    <span className="text-red-500 font-medium">Already Printed</span>
                  )}
                </td>
                <td className="p-2 border-y border-gray-300 text-center flex flex-col gap-1 items-center">
                  {!log.timeOut && (
                    <button
                      onClick={() => handleTimeOut(log)}
                      disabled={actionLoading === log._id}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-red-300"
                    >
                      {actionLoading === log._id ? "Processing..." : "Time Out"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">No logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
