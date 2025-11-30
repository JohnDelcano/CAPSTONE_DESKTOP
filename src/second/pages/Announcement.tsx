import { useEffect, useState } from "react";
import axios from "axios";
import plusIcon from "../../assets/plus.png";
interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function Announcement() {
  const API_URL = "https://api-backend-urlr.onrender.com/api/announcements";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // ✅ Fetch announcements from backend
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(API_URL);
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ✅ Handle add or edit
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      if (isEditing && selectedAnnouncement) {
        // ✏️ Update existing
        const res = await axios.put(`${API_URL}/${selectedAnnouncement._id}`, {
          title,
          content,
        });
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === selectedAnnouncement._id ? res.data.announcement : a
          )
        );
      } else {
        // ➕ Create new
        const res = await axios.post(API_URL, { title, content });
        setAnnouncements((prev) => [res.data.announcement, ...prev]);
      }

      // Reset
      setTitle("");
      setContent("");
      setIsEditing(false);
      setSelectedAnnouncement(null);
      setShowModal(false);
    } catch (err) {
      console.error("Error saving announcement:", err);
      alert("Failed to save announcement");
    }
  };

  // ✅ Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Failed to delete announcement");
    }
  };

  // ✅ Open edit modal
  const openEditModal = (announcement: Announcement) => {
    setIsEditing(true);
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setShowModal(true);
  };

  // ✅ Open add modal
  const openAddModal = () => {
    setIsEditing(false);
    setSelectedAnnouncement(null);
    setTitle("");
    setContent("");
    setShowModal(true);
  };

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex justify-between mt-2 mb-4 ml-4">
        <h2 className="text-2xl font-bold">Announcement</h2>
        {/* <div className="flex mr-4 items-center gap-2 cursor-pointer">
          <img src="/src/assets/bell.png" alt="Bell" className="w-7 h-7" />
        </div> */}
      </div>

      {/* Add Button */}
      <div className="flex justify-end items-center mb-4 ml-4">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#43435E] text-white px-3 py-2 rounded-lg hover:bg-[#5a5a7a]"
        >
          <img src={plusIcon} alt="add" className="w-5 h-5" />
          <span>Add Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="flex justify-center items-center h-[500px]">
          <h1 className="text-3xl">No Announcement.</h1>
        </div>
      ) : (
        <div className="px-6 space-y-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              className="bg-gray-100 p-4 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{a.title}</h3>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">
                    {a.content}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Edit/Delete buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(a)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Announcement" : "Add Announcement"}
            </h2>

            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3"
            />
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-3 h-28"
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isEditing ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
