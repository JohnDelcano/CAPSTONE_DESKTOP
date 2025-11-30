import { useState } from "react";
import axios from "axios"; // ✅ Add this import
import toast, { Toaster } from "react-hot-toast";
import logo from "./assets/logo.png";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  // ✅ Handles login by calling backend
  const handleLogin = async () => {
  try {
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }

    // Send login request to your backend
    const res = await axios.post("https://api-backend-urlr.onrender.com/api/admin/login", {
      email,
      password,
    });

    if (res.data.success) {
      toast.success("Login successful!");

      // Save token (optional: for future API calls)
      localStorage.setItem("token", res.data.token);

      setTimeout(() => {
        window.electronAPI?.openSecondWindow();
      }, 1000);
    } else {
      setError("Invalid email or password.");
    }
  } catch (err: unknown) {
    // ✅ Safely handle the unknown error
    if (axios.isAxiosError(err)) {
      console.error("Axios error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } else if (err instanceof Error) {
      console.error("Error:", err.message);
      setError(err.message);
    } else {
      console.error("Unknown error:", err);
      setError("An unknown error occurred.");
    }
  }
};

  // ✅ These handlers are now defined
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#43435E]">
      <Toaster position="top-center" reverseOrder={false} />
      <div
        className="p-6 text-white max-w-md w-full mx-4 sm:mx-0 rounded-[30px] flex flex-col justify-between"
        style={{
          background: "#43435E",
          boxShadow: "0px 4px 50px 25px rgba(0,0,0,0.25)",
          height: "500px",
          maxHeight: "85vh",
        }}
      >
        <div className="text-center mb-6 mt-4">
          <div className="flex items-center justify-center space-x-1 mb-8">
            <img src={logo} alt="LibroSync logo" className="w-10 h-10 object-cover" />
            <h2 className="text-[30px] font-semibold">LibroSync</h2>
          </div>
          <p className="text-[20px] opacity-80 mb-4">Welcome back!</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="text-sm text-gray-200 flex flex-col items-center mb-[100px]"
        >
          <label className="self-start ml-12">Email</label>
          <input
            className="w-full max-w-[300px] bg-transparent border-b border-gray-400 py-[5px] outline-none mb-3 p-2"
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={handleEmailChange}
          />

          <label className="self-start ml-12">Password</label>
          <input
            className="w-full max-w-[300px] bg-transparent border-b border-gray-400 py-[5px] outline-none mb-2 p-2"
            type="password"
            placeholder="Enter your password..."
            value={password}
            onChange={handlePasswordChange}
          />

          <div className="text-xs mb-8 self-end mr-12">
            <a className="underline cursor-pointer">Forgot Password?</a>
          </div>

          <button
            type="submit"
            className="bg-white hover:bg-[#AFCBFF] hover:text-white transition-colors duration-200 text-black px-4 py-2 rounded shadow w-full max-w-[300px]"
          >
            Login
          </button>

          {error && (
            <div className="text-red-400 text-sm mt-2 transition-opacity duration-300 ease-in-out opacity-100 animate-fade-in">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
