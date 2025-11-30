import { useEffect, useState, useCallback, type SyntheticEvent } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { io, Socket } from "socket.io-client";
import searchIcon from "../../assets/search.png";
// -----------------------------
// Types
// -----------------------------
interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: string;
  grade?: string;
  schoolname?: string;
  guardianname?: string;
  guardian?: string;
  validIDs?: string[];
  
}

interface Book {
  _id: string;
  title: string;
  author?: string;
  picture?: string;

}

interface Reservation {
  _id: string;
  studentId: Student;
  bookId: Book;
  reservedAt: string;
  dueDate?: string | null;
  status: string;
  
}

// -----------------------------
// Socket instance
// -----------------------------
let socket: Socket | null = null;
function getAdminSocket(): Socket {
  if (!socket) {
    socket = io("https://api-backend-urlr.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      // join admin room on connect
      socket?.emit("joinAdmin");
    });

    socket.on("connect_error", (err: Error) => {
      console.error("⚠️ Socket connection error:", err);
    });
  } else {
    // If socket already exists and is connected, make sure we join the admin room
    try {
      if (socket?.connected) socket.emit("joinAdmin");
    } catch {
      // ignore emit errors
    }
  }

  return socket as Socket;
}

// -----------------------------
// Component
// -----------------------------
export default function AdminReservation() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "All" | "Reserved" | "Approved" | "Borrowed" | "Declined" | "Returned" | "Expired"
  >("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // -----------------------------
  // Fetch reservations
  // -----------------------------
  const fetchReservations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const res = await axios.get(
        "https://api-backend-urlr.onrender.com/api/reservation/admin/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const valid = res.data.reservations.filter(
          (r: Reservation) => r.status !== "cancelled"
        );
        // server already returns newest first; keep server ordering
        setReservations(valid);
      }
    } catch (err: unknown) {
      // Handle axios errors (401) and other failures
      // axios.isAxiosError exists at runtime; use it to detect HTTP status codes
      try {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401) {
            alert("Session expired. Please log in again.");
            localStorage.removeItem("token");
            window.location.href = "/signin";
            return;
          }
          console.error("❌ Failed to fetch reservations (axios):", err.response?.data || err.message);
          return;
        }
      } catch {
        // fallthrough to generic error handling
      }

      if (err instanceof Error) {
        console.error("❌ Failed to fetch reservations:", err.message);
      } else {
        console.error("❌ Failed to fetch reservations (unknown error)");
      }
    }
  }, []);

  // -----------------------------
  // Approve / Return reservation
  // -----------------------------
  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "declined" | "returned"
  ) => {
    if (status === "approved" && !dueDate) {
      alert("Please pick a due date.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found, please login");

      const res = await axios.patch(
        `https://api-backend-urlr.onrender.com/api/reservation/${id}/status`,
        {
          status,
          customDueDate: status === "approved" ? dueDate?.toISOString() : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const updated: Reservation = res.data.reservation;
        setReservations((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        );
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("❌ Failed to update status:", err);
      alert("Failed to update reservation.");
    }
  };

  // -----------------------------
  // Reset due date when modal opens
  // -----------------------------
  useEffect(() => {
    if (isModalOpen && selectedReservation) {
      setDueDate(selectedReservation.dueDate ? new Date(selectedReservation.dueDate) : null);
    }
  }, [isModalOpen, selectedReservation]);

  // -----------------------------
  // Socket + initial fetch
  // -----------------------------
  useEffect(() => {
    fetchReservations();

    const s = getAdminSocket();

    const handleNew = (newRes: Reservation) => {
      setReservations((prev) => {
        const exists = prev.find((r) => r._id === newRes._id);
        if (exists) return prev;
        // prepend new reservation (server usually sends newest first)
        return [newRes, ...prev];
      });
    };

    const handleUpdated = (updated: Reservation) => {
      setReservations((prev) =>
        prev.map((r) => {
          if (r._id !== updated._id) return r;
          // prefer updated nested objects when present, otherwise keep existing
          const updatedStudent = (updated as unknown as Reservation).studentId;
          const updatedBook = (updated as unknown as Reservation).bookId;

          return {
            ...r,
            ...updated,
            studentId: updatedStudent ?? r.studentId,
            bookId: updatedBook ?? r.bookId,
          } as Reservation;
        })
      );
    };

    s.on("reservationCreated", handleNew);
    s.on("reservationUpdated", handleUpdated);

    return () => {
      s.off("reservationCreated", handleNew);
      s.off("reservationUpdated", handleUpdated);
    };
  }, [fetchReservations]);

  // -----------------------------
  // Filter + Search
  // -----------------------------
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.studentId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      r.bookId?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || r.status?.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
      case "borrowed":
        return "bg-green-100 text-green-800";
      case "returned":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-pink-100 text-pink-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="flex-1">
      <div className="flex justify-between mt-2 mb-8 ml-4">
        <div>
          <h2 className="text-2xl font-bold">All Reservations</h2>
          <p className="text-sm opacity-80">
            Total Reservations: {filteredReservations.length}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="ml-4 mb-4">
        <div className="relative flex items-center mb-3">
        <img src={searchIcon} alt="Search" className="absolute left-3 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by student, ID, or book"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded pl-10 px-2 py-2 w-64 text-sm bg-white border-black"
        />
        </div>
        

        <div className="flex gap-2 mt-4">
          {["All", "Reserved", "Approved", "Borrowed", "Returned", "Declined", "Expired"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-3 py-1 rounded-md ${
                  filter === f ? "bg-[#43435E] text-white" : "bg-gray-200 opacity-80"
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ml-4 mr-4">
        <table className="w-full text-sm bg-[#D9D9D9] rounded-md border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left bg-[#43435E] text-[#D9D9D9]">
              <th className="p-2">Student ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Book</th>
              <th className="p-2">Reserved At</th>
              <th className="p-2">Due</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length > 0 ? (
              filteredReservations.map((r) => {
                // defensive extraction (server sometimes sends ids instead of populated objects)
                const rawStudent = (r as unknown as { studentId?: Student | string }).studentId;
                const studentObj = typeof rawStudent === "string" ? null : (rawStudent as Student | undefined);
                const studentIdVal = typeof rawStudent === "string" ? (rawStudent as string) : studentObj?.studentId ?? "-";
                const studentName = studentObj ? `${studentObj.firstName || ""} ${studentObj.lastName || ""}`.trim() || "-" : "-";
                const rawBook = (r as unknown as { bookId?: Book | string }).bookId;
                const bookTitle = typeof rawBook === "string" ? (rawBook as string) : (rawBook as Book | undefined)?.title ?? "Unknown Book";

                return (
                  <tr key={r._id} className="bg-white shadow-sm">
                    <td className="p-2">{studentIdVal}</td>
                    <td className="p-2">{studentName}</td>
                    <td className="p-2">{bookTitle}</td>
                    <td className="p-2">{new Date(r.reservedAt).toLocaleString()}</td>
                    <td className="p-2">{r.dueDate ? new Date(r.dueDate).toLocaleString() : "-"}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${getBadgeColor(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2 flex gap-2">
                      {r.status === "reserved" && (
                        <button
                          onClick={() => {
                            setSelectedReservation(r);
                            setIsModalOpen(true);
                          }}
                          className="px-2 py-1 bg-green-500 text-white rounded-md text-xs"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button
                          onClick={() => {
                            setSelectedReservation(r);
                            setIsModalOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded-md text-xs"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4 bg-white">
                  No reservations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedReservation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-[800px] shadow-lg overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-semibold mb-6 text-center text-[#43435E]">
              Reservation Details
            </h3>

            <div className="flex gap-8 mb-6">
              {/* Book */}
              <div className="w-1/2 bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-1">
                  📚 Book Details
                </h4>
                <div className="flex flex-col items-center">
                  <img
                    src={selectedReservation.bookId?.picture ?? ""}
                    alt={selectedReservation.bookId?.title ?? "Book"}
                    className="w-40 h-56 object-cover rounded-md border shadow-sm mb-3"
                    onError={(e: SyntheticEvent<HTMLImageElement>) => {
                      // hide broken image
                      const t = e.currentTarget as HTMLImageElement;
                      t.style.display = "none";
                    }}
                  />
                  <p className="font-medium text-center text-lg">
                    {selectedReservation.bookId?.title ?? "Unknown Title"}
                  </p>
                  {selectedReservation.bookId?.author && (
                    <p className="text-sm text-gray-600 text-center">
                      {selectedReservation.bookId.author}
                    </p>
                  )}
                </div>
              </div>

              {/* Student */}
              <div className="w-1/2 bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-1">
                  👩‍🎓 Student Details
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {
                    (() => {
                      const rawStudent = (selectedReservation as unknown as { studentId?: Student | string }).studentId;
                      const s = typeof rawStudent === "string" ? null : (rawStudent as Student | undefined);
                      const sid = typeof rawStudent === "string" ? (rawStudent as string) : s?.studentId ?? "-";
                      const sname = s ? `${s.firstName || ""} ${s.lastName || ""}`.trim() || "-" : "-";
                      return (
                        <>
                          <p><strong>Student ID:</strong> {sid}</p>
                          <p><strong>Name:</strong> {sname}</p>
                          <p><strong>Email:</strong> {s?.email || "N/A"}</p>
                          <p><strong>Phone:</strong> {s?.phone || "N/A"}</p>
                          <p><strong>Gender:</strong> {s?.gender || "N/A"}</p>
                          <p><strong>School:</strong> {s?.schoolname || "N/A"}</p>
                          <p><strong>Guardian Name:</strong> {s?.guardianname || "N/A"}</p>
                          <p><strong>Guardian Contact:</strong> {s?.guardian || "N/A"}</p>
                        </>
                      );
                    })()
                  }
                </div>

                {/* Valid IDs */}
                {(() => {
                  const rawStudent = (selectedReservation as unknown as { studentId?: Student | string }).studentId;
                  const s = typeof rawStudent === "string" ? null : (rawStudent as Student | undefined);
                  if (s && Array.isArray(s.validIDs) && s.validIDs.length > 0) {
                    return (
                      <div className="flex gap-4 justify-center flex-wrap mt-4">
                        {s.validIDs.map((idUrl, idx) => (
                          <div key={idx} className="relative cursor-pointer transition-transform hover:scale-105"
                               onClick={() => window.open(idUrl, "_blank")}>
                            <img
                              src={idUrl}
                              alt={`Valid ID ${idx + 1}`}
                              className="w-44 h-28 object-cover rounded-md border border-gray-300 shadow-sm"
                              onError={(e: SyntheticEvent<HTMLImageElement>) => { const t = e.currentTarget as HTMLImageElement; t.style.display = "none"; }}
                            />
                            <span className="absolute bottom-1 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                              ID {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <p className="text-center text-gray-500 mt-4">No valid IDs uploaded.</p>;
                })()}

              </div>
            </div>

            {/* Due Date */}
            <div className="bg-gray-100 p-4 rounded-lg border mb-6">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-1">📅 Set Due Date</h4>
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                minDate={new Date()}
                className="w-full p-3 border-2 border-[#43435E] rounded-md text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#43435E]"
                placeholderText="Select a due date"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {selectedReservation.status === "reserved" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReservation._id, "approved")}
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-base"
                  >
                    Approve
                  </button>
                )}
                {selectedReservation.status === "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReservation._id, "returned")}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-base"
                  >
                    Return
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
