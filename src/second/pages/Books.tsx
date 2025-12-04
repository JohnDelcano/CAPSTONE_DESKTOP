import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import searchIcon from "../../assets/search.png";
import plusIcon from "../../assets/plus.png";

interface Book {
  _id: string;
  title: string;
  author: string;
  quantity?: number;
  category?: string[];
  picture?: string;
  pdfFile?: string;
  overview?: string;
  availableCount?: number;
  reservedCount?: number;
  borrowedCount?: number;
  lostCount?: number;
  status?: string;
}

const CATEGORY_OPTIONS: string[] = [
  "Science","Mathematics","Literature","History","Technology","Philosophy",
  "Chemistry","Computer Science","Fiction","Non-Fiction","Programming",
  "Educational","Ap","Physics","Bayanihan","MAPEH","Wikang Filipino",
  "Pagsulong at Pagbabago","Kindergarden","Tagalog","English",
];

export default function BooksModalGrow(): ReactElement {
  const API = "https://api-backend-urlr.onrender.com/api/books";
  const CLOUDINARY_UPLOAD_PRESET = "Book_preset";
  const CLOUDINARY_CLOUD_NAME = "dckhxhaws";

  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const [newBook, setNewBook] = useState({
    title: "", author: "", quantity: "", category: [] as string[], picture: "", pdfFile: "", overview: ""
  });

  const [editBook, setEditBook] = useState<Book | null>(null);

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch books.");
    }
  };

  const getPdfViewUrl = (url: string) => url ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : "";
  const openPdfViewer = (url: string) => { setPdfUrl(url); setIsPdfModalOpen(true); };

  // CLOUDINARY IMAGE UPLOAD
  const handleUploadImage = async (file: File, isEdit = false) => {
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        if (isEdit && editBook) setEditBook({ ...editBook, picture: data.secure_url });
        else setNewBook({ ...newBook, picture: data.secure_url });
        toast.success("Image uploaded successfully!");
      } else toast.error("Upload failed — check Cloudinary settings.");
    } catch (err) { console.error(err); toast.error("Error uploading image."); }
    finally { setUploadingImage(false); }
  };

  // CLOUDINARY PDF UPLOAD
  const handleUploadPDF = async (file: File, isEdit = false) => {
    if (!file || file.type !== "application/pdf") return toast.error("Please upload a valid PDF (<10MB).");
    if (file.size > 10*1024*1024) return toast.error("PDF file size must be <10MB.");

    setUploadingPDF(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("resource_type", "raw");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.secure_url) {
        if (isEdit && editBook) setEditBook({ ...editBook, pdfFile: data.secure_url });
        else setNewBook({ ...newBook, pdfFile: data.secure_url });
        toast.success("PDF uploaded successfully!");
      } else toast.error("PDF upload failed.");
    } catch (err) { console.error(err); toast.error("Error uploading PDF."); }
    finally { setUploadingPDF(false); }
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) return toast.error("Title and Author required.");
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newBook, quantity: Number(newBook.quantity)||0 }) });
      if (!res.ok) throw new Error("Add failed");
      const added: Book = (await res.json()).book ?? await res.json();
      setBooks([...books, added]);
      setIsAddModalOpen(false);
      setNewBook({ title:"",author:"",quantity:"",category:[],picture:"",pdfFile:"",overview:"" });
      toast.success("Book added!");
    } catch (err) { console.error(err); toast.error("Error adding book."); }
  };

  const openEditModal = (book: Book) => { setEditBook({ ...book }); setIsEditModalOpen(true); };
  const handleSaveEdit = async () => {
    if (!editBook) return;
    if (!editBook.title.trim() || !editBook.author.trim()) return toast.error("Title & Author required.");
    try {
      const res = await fetch(`${API}/${editBook._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editBook) });
      if (!res.ok) throw new Error("Update failed");
      const updated: Book = (await res.json()).book ?? await res.json();
      setBooks(books.map(b => b._id===updated._id ? updated : b));
      setIsEditModalOpen(false); setEditBook(null); setSelectedBook(null);
      toast.success("Book updated!");
    } catch (err) { console.error(err); toast.error("Error updating book."); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error("Delete failed");
      setBooks(books.filter(b => b._id!==id));
      if (selectedBook?._id===id) setSelectedBook(null);
      toast.success("Book deleted!");
    } catch (err) { console.error(err); toast.error("Error deleting book."); }
  };

  const filtered = books.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.category ?? []).join(", ").toLowerCase().includes(q);
  });

  return (
    <div className="flex-1">
      <Toaster position="top-center"/>
      
      {/* Search + Add */}
      <div className="flex justify-between mt-2 mb-8 ml-4">
        <div>
          <h2 className="text-2xl font-bold">List of Books</h2>
          <p className="text-sm opacity-80">Total books: {filtered.length}</p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4 ml-4 mr-4">
        <div className="relative flex items-center">
          <img src={searchIcon} alt="search" className="absolute left-3 w-5 h-5"/>
          <input className="border rounded pl-10 px-2 py-2 w-64 text-sm bg-white border-black"
                 placeholder="Search by title, author, or category"
                 value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button onClick={()=>setIsAddModalOpen(true)} className="flex items-center gap-2 bg-[#43435E] text-white px-3 py-2 rounded-lg hover:bg-[#5a5a7a]">
          <img src={plusIcon} alt="add" className="w-5 h-5"/><span>Add Book</span>
        </button>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ml-4 mr-4">
        {filtered.map((book) => (
          <motion.div key={book._id} whileHover={{scale:1.05}} className="bg-white rounded-2xl shadow hover:shadow-lg transition flex flex-col items-center p-3 relative cursor-pointer" onClick={()=>setSelectedBook(book)}>
            <img src={book.picture?.startsWith("http") ? book.picture : "/src/assets/default-book.png"} alt={book.title} className="w-full h-[180px] object-cover rounded-lg mb-2"/>
            <h3 className="font-semibold text-sm truncate w-full text-center">{book.title}</h3>
            <p className="text-xs text-gray-600 truncate w-full text-center">{book.author}</p>
            {book.pdfFile && <span className="text-xs text-blue-600 mt-1">📄 PDF Available</span>}
          </motion.div>
        ))}
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelectedBook(null)}>
            <motion.div className="bg-white rounded-2xl shadow-2xl w-[70%] max-w-2xl max-h-[90vh] p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} onClick={e=>e.stopPropagation()}>
              
              <button onClick={()=>setSelectedBook(null)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>

              {/* Left: Book Cover */}
              <div className="flex flex-col justify-between items-center">
                <img src={selectedBook.picture || "/src/assets/default-book.png"} alt={selectedBook.title} className="w-64 h-80 object-cover rounded-lg shadow-md"/>
                {/* PDF + Edit/Delete */}
                <div className="flex mt-4 gap-2 justify-center flex-wrap">
                  {selectedBook.pdfFile && (
                    <button onClick={()=>openPdfViewer(selectedBook.pdfFile!)} className="px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded shadow-md hover:bg-blue-200 hover:shadow-lg hover:ring-2 hover:ring-blue-300 transition border border-blue-300">
                      View PDF
                    </button>
                  )}
                  <button onClick={()=>openEditModal(selectedBook)} className="px-6 py-2 bg-green-100 text-green-700 font-semibold rounded shadow-md hover:bg-green-200 hover:shadow-lg hover:ring-2 hover:ring-green-300 transition border border-green-300">
                    Edit
                  </button>
                  <button onClick={()=>handleDelete(selectedBook._id)} className="px-6 py-2 bg-red-100 text-red-700 font-semibold rounded shadow-md hover:bg-red-200 hover:shadow-lg hover:ring-2 hover:ring-red-300 transition border border-red-300">
                    Delete
                  </button>
                </div>

              </div>

              {/* Right: Book Details */}
              <div className="space-y-3 text-gray-700 overflow-y-auto pr-2 max-h-[70vh]">
                <h2 className="text-2xl font-bold break-words line-clamp-3">{selectedBook.title}</h2>
                <p><span className="font-semibold">Author:</span> {selectedBook.author}</p>
                <p><span className="font-semibold">Overview:</span> {selectedBook.overview || "N/A"}</p>
                <p><span className="font-semibold">Category:</span> {selectedBook.category?.length ? selectedBook.category.join(", ") : "N/A"}</p>
                <p><span className="font-semibold">Total Quantity:</span> {selectedBook.quantity ?? 0}</p>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-4">
                  <div className="bg-green-100 p-2 rounded-md text-center">
                    <p className="font-semibold text-green-700">Available</p>
                    <p>{selectedBook.availableCount ?? 0}</p>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-md text-center">
                    <p className="font-semibold text-yellow-700">Reserved</p>
                    <p>{selectedBook.reservedCount ?? 0}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-md text-center">
                    <p className="font-semibold text-blue-700">Borrowed</p>
                    <p>{selectedBook.borrowedCount ?? 0}</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-md text-center">
                    <p className="font-semibold text-red-700">Lost</p>
                    <p>{selectedBook.lostCount ?? 0}</p>
                  </div>
                </div>

                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[60]" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsPdfModalOpen(false)}>
            <motion.div className="bg-white rounded-lg w-[95%] h-[95vh] relative" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setIsPdfModalOpen(false)} className="absolute top-2 right-2 z-10 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Close</button>
              <iframe src={getPdfViewUrl(pdfUrl)} className="w-full h-full rounded-lg" title="PDF Viewer"/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="addModal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <div className="bg-white rounded-xl p-6 w-[360px] max-h-[90vh] overflow-y-auto shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Add New Book</h3>
              <input
                placeholder="Title"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                placeholder="Quantity"
                value={newBook.quantity}
                onChange={(e) => setNewBook({ ...newBook, quantity: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <textarea
  placeholder="Overview"
  value={newBook.overview}
  onChange={(e) =>
    setNewBook({ ...newBook, overview: e.target.value })
  }
  className="border p-2 rounded w-full mb-2"
  rows={4}
/>

              <label className="block mb-1 text-sm font-medium">Category</label>
              <div className="grid grid-cols-2 gap-2 mb-3 max-h-40 overflow-y-auto border p-2 rounded">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newBook.category.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewBook({
                            ...newBook,
                            category: [...newBook.category, cat],
                          });
                        } else {
                          setNewBook({
                            ...newBook,
                            category: newBook.category.filter((c) => c !== cat),
                          });
                        }
                      }}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {/* Upload Image */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Book Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleUploadImage(e.target.files[0])
                  }
                  className="border p-2 rounded w-full"
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                )}
                {newBook.picture && (
                  <img
                    src={newBook.picture}
                    alt="preview"
                    className="w-24 h-32 object-cover mt-2 rounded"
                  />
                )}
              </div>

              {/* Upload PDF */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Book PDF (optional, max 10MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    e.target.files && handleUploadPDF(e.target.files[0])
                  }
                  className="border p-2 rounded w-full"
                  disabled={uploadingPDF}
                />
                {uploadingPDF && (
                  <p className="text-sm text-blue-600 mt-1">Uploading PDF...</p>
                )}
                {newBook.pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <span>✓</span>
                    <span>PDF uploaded successfully</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBook}
                  className="px-3 py-1 bg-[#43435E] text-white rounded"
                  disabled={uploadingImage || uploadingPDF}
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && editBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="editModal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <div className="bg-white rounded-xl p-6 w-[360px] max-h-[90vh] overflow-y-auto shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Edit Book</h3>
              <input
                placeholder="Title"
                value={editBook.title}
                onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                placeholder="Author"
                value={editBook.author}
                onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                placeholder="Quantity"
                value={editBook.quantity ?? ""}
                onChange={(e) =>
                  setEditBook({
                    ...editBook,
                    quantity: Number(e.target.value) || 0,
                  })
                }
                className="border p-2 rounded w-full mb-2"
              />
              <textarea
  placeholder="Overview"
  value={editBook.overview ?? ""}
  onChange={(e) =>
    setEditBook({ ...editBook, overview: e.target.value })
  }
  className="border p-2 rounded w-full mb-2"
  rows={4}
/>


              <label className="block mb-1 text-sm font-medium">Category</label>
              <div className="grid grid-cols-2 gap-2 mb-3 max-h-40 overflow-y-auto border p-2 rounded">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editBook.category?.includes(cat)}
                      onChange={(e) => {
                        if (!editBook) return;

                        if (e.target.checked) {
                          setEditBook({
                            ...editBook,
                            category: [...(editBook.category || []), cat],
                          });
                        } else {
                          setEditBook({
                            ...editBook,
                            category: (editBook.category || []).filter(
                              (c) => c !== cat
                            ),
                          });
                        }
                      }}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              {/* Replace Picture */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Replace Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleUploadImage(e.target.files[0], true)
                  }
                  className="border p-2 rounded w-full"
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                )}
                {editBook.picture && (
                  <img
                    src={editBook.picture}
                    alt="preview"
                    className="w-24 h-32 object-cover mt-2 rounded"
                  />
                )}
              </div>

              {/* Replace PDF */}
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">
                  Replace PDF (optional, max 10MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    e.target.files && handleUploadPDF(e.target.files[0], true)
                  }
                  className="border p-2 rounded w-full"
                  disabled={uploadingPDF}
                />
                {uploadingPDF && (
                  <p className="text-sm text-blue-600 mt-1">Uploading PDF...</p>
                )}
                {editBook.pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <span>✓</span>
                    <span>PDF uploaded</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-10 py-2 border rounded border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-12 py-2 bg-[#43435E] text-white rounded border border-blue-200"
                  disabled={uploadingImage || uploadingPDF}
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}