import { RiMenu2Line, RiMenu3Line } from "react-icons/ri";
import { useState, useEffect } from "react";
import axios from "axios";

const Navbar = ({ setIsCollapsed, isCollapsed }) => {
  const [mentorName, setMentorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorName();
  }, []);

  const fetchMentorName = async () => {
    try {
      const storedMentorId = localStorage.getItem("mentorId");
      if (!storedMentorId) return;

      const response = await axios.get(
        `https://api.techsterker.com/api/our-mentor/profile/${storedMentorId}`
      );
      
      if (response.data.data) {
        const { firstName, lastName } = response.data.data;
        setMentorName(`${firstName} ${lastName}`);
      }
    } catch (error) {
      console.error("Error fetching mentor name:", error);
      setMentorName("Mentor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white sticky top-0 w-full h-16 px-6 flex items-center shadow-lg z-50">
      {/* Sidebar toggle button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300"
      >
        {isCollapsed ? (
          <RiMenu2Line className="text-xl text-white" />
        ) : (
          <RiMenu3Line className="text-xl text-white" />
        )}
      </button>

      {/* Mentor Name on LEFT side */}
      <div className="ml-4">
        <div className="text-lg font-semibold">
          {loading ? "Loading..." : mentorName}
        </div>
      </div>

      {/* Spacer to push logo to right */}
      <div className="flex-grow"></div>

      {/* Logo on the right side */}
      <div className="flex items-center gap-2">
        <img
          src="/lightlogo.png"
          alt="Logo"
          className="w-[40px] h-auto drop-shadow-lg"
        />
      </div>
    </nav>
  );
};

export default Navbar;