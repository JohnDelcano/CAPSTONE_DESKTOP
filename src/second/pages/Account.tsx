import { useEffect, useState } from "react";
import searchIcon from "../../assets/search.png";
import editIcon from "../../assets/edit.png";
type Student = {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  validIDs?: string[];
  birthday?: string;
  phone?: string;
  address?: string;
  schoolname?: string;
  guardian?: string;
  guardianname?: string;
  gender?: string;
  genre?: string[];
  grade: string;
  status?: "Pending" | "Active" | "Inactive" | "Blocked" | string;
};

function Badge({ color, text }: { color: string; text: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${
        colorMap[color] || "bg-gray-100 text-gray-800"
      }`}
    >
      {text}
    </span>
  );
}

export default function Account() {
  const [users, setUsers] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "All" | "Active" | "Inactive" | "Pending" | "Blocked"
  >("All");
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 🔹 Fetch students from your API
  useEffect(() => {
    fetch("https://api-backend-urlr.onrender.com/api/students")
  .then((res) => res.json())
  .then((data) => {
    if (data.success) setUsers(data.data);
  })
  .catch((err) => console.error("Error fetching users:", err));

  }, []);

  // 🔹 Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      filter === "All" || (u.status && u.status.toLowerCase() === filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const getBadgeColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Inactive":
        return "yellow";
      case "Blocked":
        return "red";
      case "Pending":
        return "gray";
      default:
        return "gray";
    }
  };

 const handleVerify = async (user: Student) => {
  try {
    const res = await fetch(
      `https://api-backend-urlr.onrender.com/api/students/${user._id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
          cooldownUntil: null,
          activeReservations: 0,
        }),
      }
    );

    const data = await res.json();

    if (res.ok && data.success) {
      alert(`${user.firstName} ${user.lastName} has been verified and can now reserve books!`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: "Active" } : u))
      );
      setModalOpen(false);
    } else {
      alert(data.message || "Failed to verify student. Please try again.");
    }
  } catch (err) {
    console.error("Error verifying student:", err);
    alert("An error occurred while verifying the student.");
  }
};


  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between mt-2 mb-8 ml-4">
        <div>
          <h2 className="text-2xl font-bold">Account</h2>
          <p className="text-sm opacity-80">Total account: {filteredUsers.length}</p>
        </div>
        {/* <div className="flex mr-4 items-center gap-2 cursor-pointer">
          <img src="/src/assets/bell.png" alt="Dropdown" className="w-7 h-7" />
        </div> */}
      </div>

      {/* Search + Filter */}
      <div className="ml-4 mb-4">
        <div className="relative flex items-center mb-3">
          <img src={searchIcon} alt="Search" className="absolute left-3 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded pl-10 px-2 py-2 w-64 text-sm bg-white border-black"
          />
        </div>

        <div className="flex gap-2">
          {["All", "Active", "Inactive", "Pending", "Blocked"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1 rounded-md ${
                filter === f ? "bg-[#43435E] text-white" : "opacity-80 bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ml-4 mr-4">
        <table className="w-full text-sm bg-[#D9D9D9] rounded-md border-separate border-spacing-y-1">
          <thead>
            <tr className="text-left text-[#D9D9D9] bg-[#43435E]">
              <th className="p-3">Student ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">School Name</th>
              <th className="p-2">Year Level</th>
              <th className="p-2">Status</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              [...filteredUsers].reverse().map((u) => (
                <tr key={u._id} className="bg-white shadow-sm">
                  <td className="p-2 border-y border-gray-300">{u.studentId}</td>
                  <td className="p-2 border-y border-gray-300">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="p-2 border-y border-gray-300">{u.schoolname}</td>
                  <td className="p-2 border-y border-gray-300">{u.grade}</td>
                  <td className="p-2 border-y border-gray-300">
                    <Badge color={getBadgeColor(u.status)} text={u.status || "Unknown"} />
                  </td>
                  <td className="p-2 border-y border-gray-300 text-center">
                    <button
                      className="px-2 py-1"
                      onClick={() => {
                        setSelectedUser(u);
                        setModalOpen(true);
                      }}
                    >
                      <img src={editIcon} alt="View" className="w-4 h-4 inline" />
                    </button>
                    {/* <button
                      className="px-2 py-1"
                      onClick={() => {
                        setSelectedUser(u);
                        setModalOpen(true);
                      }}
                    >
                      <img src="/src/assets/edit.png" alt="Edit" className="w-4 h-4 inline" />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-4 bg-white">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

   
      {/* 🔹 Modal for View / Edit */}
{modalOpen && selectedUser && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 border-b pb-3">
        {selectedUser.profilePicture && (
          <img
            src={selectedUser.profilePicture}
            alt="Profile"
            className="w-14 h-14 rounded-full object-cover border"
          />
        )}
        <div>
          <h3 className="text-xl font-semibold">
            {selectedUser.firstName} {selectedUser.lastName}
          </h3>
          <p className="text-gray-600 text-sm">{selectedUser.email}</p>
        </div>
      </div>

      {/* Valid IDs */}
{selectedUser.validIDs && selectedUser.validIDs.length > 0 && (
  <div className="mb-6">
    <h4 className="font-semibold mb-3 text-lg">Valid ID(s):</h4>
    <div className="flex gap-4 overflow-x-auto p-3 bg-gray-50 rounded-md border">
      {selectedUser.validIDs.map((idUrl, idx) => (
        <div
          key={idx}
          className="relative rounded-md shadow-md border border-gray-300 bg-white flex-shrink-0 cursor-zoom-in hover:shadow-lg transition-all duration-200"
          onClick={() => window.open(idUrl, "_blank")}
          style={{
            width: "250px", // 💳 ID width
            height: "157px", // 💳 ID height (1.586:1 ratio)
            borderRadius: "8px",
          }}
        >
          <img
            src={idUrl}
            alt={`Valid ID ${idx + 1}`}
            className="object-cover w-full h-full rounded-md"
          />
          <span className="absolute bottom-1 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded-md">
            {idx === 0 ? "Front" : idx === 1 ? "Back" : `ID ${idx + 1}`}
          </span>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">
      (Click any ID to open full size in new tab.)
    </p>
  </div>
)}


      {/* User Details */}
      <div className="space-y-1 text-sm">
        <p><strong>Phone:</strong> {selectedUser.phone || "N/A"}</p>
        <p><strong>Address:</strong> {selectedUser.address || "N/A"}</p>
        <p><strong>School:</strong> {selectedUser.schoolname}</p>
        <p><strong>Grade:</strong> {selectedUser.grade}</p>
        <p><strong>Guardian:</strong> {selectedUser.guardianname || "N/A"}</p>
        <p>
          <strong>Status:</strong>{" "}
          <Badge
            color={getBadgeColor(selectedUser.status)}
            text={selectedUser.status || "Unknown"}
          />
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end mt-6 gap-3">
        {selectedUser.status === "Pending" && (
          <button
            onClick={() => handleVerify(selectedUser)}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Verify
          </button>
        )}
        <button
          onClick={() => setModalOpen(false)}
          className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
