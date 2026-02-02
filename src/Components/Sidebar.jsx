import React, { useState, useEffect } from "react";
import {
  FaChevronDown, FaChevronRight, FaSignOutAlt, FaUserCircle,
  FaBook, FaCalendarAlt, FaUsers, FaFileAlt, FaVideo,
  FaUserCog, FaTachometerAlt, FaHome, FaGraduationCap,
  FaClipboardList, FaCommentDots, FaChalkboardTeacher,
  FaLayerGroup, FaBullhorn, FaBell, FaCog, FaExternalLinkAlt
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ isCollapsed, isMobile }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchMentorData();

    const path = location.pathname;
    elements.forEach(item => {
      if (item.dropdown) {
        const matchingItem = item.dropdown.find(sub => sub.path === path);
        if (matchingItem) {
          setOpenDropdown(item.name);
        }
      }
    });
  }, [location.pathname]);

  const fetchMentorData = async () => {
    try {
      const storedMentorId = localStorage.getItem("mentorId");
      if (!storedMentorId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://api.techsterker.com/api/our-mentor/profile/${storedMentorId}`
      );

      if (response.data.data) {
        setMentorData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching mentor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = () => {
    localStorage.removeItem("mentorId");
    localStorage.removeItem("mentorName");
    const event = new CustomEvent('showToast', {
      detail: {
        message: 'Logged out successfully!',
        type: 'success'
      }
    });
    window.dispatchEvent(event);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  const handlePixelMindClick = () => {
    window.open("https://pixelmindsolutions.com/", "_blank");
  };

  const getIconForItem = (name) => {
    switch (name) {
      case "Dashboard": return <FaHome className="text-lg" />;
      case "Courses": return <FaLayerGroup className="text-lg" />;
      case "Enrollments": return <FaGraduationCap className="text-lg" />;
      case "Batches": return <FaCalendarAlt className="text-lg" />;
      case "Messages": return <FaCommentDots className="text-lg" />;
      case "Quizzes": return <FaClipboardList className="text-lg" />;
      case "Classes": return <FaChalkboardTeacher className="text-lg" />;
      case "Announcements": return <FaBullhorn className="text-lg" />;
      case "Profile": return <FaUserCog className="text-lg" />;
      case "Logout": return <FaSignOutAlt className="text-lg" />;
      default: return <FaHome className="text-lg" />;
    }
  };

  const getMentorInitials = () => {
    if (mentorData) {
      const first = mentorData.firstName?.charAt(0) || "M";
      const last = mentorData.lastName?.charAt(0) || "P";
      return `${first}${last}`.toUpperCase();
    }
    return "MP";
  };

  const getMentorName = () => {
    if (mentorData) {
      return `${mentorData.firstName || ""} ${mentorData.lastName || ""}`.trim();
    }
    return "Mentor";
  };

  const elements = [
    {
      icon: getIconForItem("Dashboard"),
      name: "Dashboard",
      gradient: "from-cyan-500 to-blue-600",
      dropdown: [{ name: "Overview", path: "/dashboard", icon: <FaChevronRight className="text-xs" /> }],
    },
    // {
    //   icon: getIconForItem("Courses"),
    //   name: "Courses",
    //   gradient: "from-emerald-500 to-teal-500",
    //   dropdown: [{ name: "View Courses", path: "/mentorcourselist", icon: <FaChevronRight className="text-xs" /> }],
    // },
    // {
    //   icon: getIconForItem("Enrollments"),
    //   name: "Enrollments",
    //   gradient: "from-violet-500 to-purple-600",
    //   dropdown: [{ name: "View Enrollments", path: "/mentorenrollments", icon: <FaChevronRight className="text-xs" /> }],
    // },
    {
      icon: getIconForItem("Batches"),
      name: "Batches",
      gradient: "from-amber-500 to-orange-500",
      dropdown: [{ name: "View Batches", path: "/mentorbatchs", icon: <FaChevronRight className="text-xs" /> }],
    },
    {
      icon: getIconForItem("Messages"),
      name: "Messages",
      gradient: "from-rose-500 to-pink-500",
      dropdown: [
        { name: "Chats", path: "/chats", icon: <FaChevronRight className="text-xs" /> },
      ],
    },
    // {
    //   icon: getIconForItem("Quizzes"),
    //   name: "Quizzes",
    //   gradient: "from-indigo-500 to-blue-500",
    //   dropdown: [
    //     { name: "Create Quiz", path: "/quizz", icon: <FaChevronRight className="text-xs" /> },
    //     { name: "Quiz List", path: "/quizzlist", icon: <FaChevronRight className="text-xs" /> },
    //     { name: "Quiz Submissions", path: "/quizzsubmission", icon: <FaChevronRight className="text-xs" /> },
    //   ],
    // },
    {
      icon: getIconForItem("Classes"),
      name: "Classes",
      gradient: "from-red-500 to-orange-500",
      dropdown: [
        { name: "Create Live Classes", path: "/createliveclasses", icon: <FaChevronRight className="text-xs" /> },
        { name: "Live Classes", path: "/mentorliveclasses", icon: <FaChevronRight className="text-xs" /> },
        // { name: "ClassModules", path: "/classmodule", icon: <FaChevronRight className="text-xs" /> },
        { name: "Upload Attendance", path: "/uploadattendance", icon: <FaChevronRight className="text-xs" /> },
        { name: "All Attendance", path: "/mentorgetattendance", icon: <FaChevronRight className="text-xs" /> },
        { name: "Create Quiz", path: "/quizz", icon: <FaChevronRight className="text-xs" /> },
        { name: "Quiz List", path: "/quizzlist", icon: <FaChevronRight className="text-xs" /> },
        { name: "Quiz Submissions", path: "/quizzsubmission", icon: <FaChevronRight className="text-xs" /> },
      ],
    },
    {
      icon: getIconForItem("Tasks"),
      name: "Tasks",
      gradient: "from-indigo-500 to-blue-500",
      dropdown: [
        { name: "Create Task", path: "/create-task", icon: <FaChevronRight className="text-xs" /> },
        { name: "Tasks List", path: "/tasklist", icon: <FaChevronRight className="text-xs" /> },
        { name: "Tasks Submissions", path: "/tasksubmissions", icon: <FaChevronRight className="text-xs" /> },
        { name: "Doubts", path: "/doubt", icon: <FaChevronRight className="text-xs" /> },
      ],
    },
    // {
    //   icon: getIconForItem("Announcements"),
    //   name: "Announcements",
    //   gradient: "from-yellow-500 to-amber-500",
    //   dropdown: [{ name: "View Announcements", path: "/announcements", icon: <FaChevronRight className="text-xs" /> }],
    // },
    {
      icon: getIconForItem("Profile"),
      name: "Profile",
      gradient: "from-sky-500 to-cyan-500",
      dropdown: [{ name: "View Profile", path: "/profile", icon: <FaChevronRight className="text-xs" /> }],
    },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div
      className={`transition-all duration-300 ease-out ${isMobile
          ? isCollapsed
            ? "w-0 opacity-0"
            : "w-72 opacity-100"
          : isCollapsed
            ? "w-20"
            : "w-72"
        } h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 backdrop-blur-3xl border-r border-blue-100/50 shadow-xl`}
    >
      {/* Header with API Data */}
      <div className="sticky top-0 z-10 p-6 flex flex-col items-center bg-gradient-to-r from-white to-blue-50/80 backdrop-blur-xl border-b border-blue-100/60">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-300/40">
            <div className="font-bold text-white text-lg">
              {getMentorInitials()}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-3 border-white shadow-md"></div>
        </div>
        <span
          className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 text-xl ${isCollapsed && !isMobile ? "hidden" : "block"
            }`}
        >
          {loading ? "Loading..." : getMentorName()}
        </span>
        <span
          className={`text-xs text-blue-500 mt-1 ${isCollapsed && !isMobile ? "hidden" : "block"
            }`}
        >
          {mentorData?.expertise ? mentorData.expertise.split(',')[0] : "Teaching Dashboard"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-2">
          {elements.map((item, idx) => {
            const isDropdownOpen = openDropdown === item.name;
            const hasDropdown = item.dropdown && item.dropdown.length > 0;
            const isActive = item.dropdown?.some((sub) => isActivePath(sub.path));

            return (
              <div key={idx} className="relative">
                {/* Main Menu Item */}
                <div
                  className={`flex items-center py-3 px-4 rounded-2xl transition-all duration-300 cursor-pointer group ${isCollapsed && !isMobile ? "justify-center px-2" : ""
                    } ${isDropdownOpen || isActive
                      ? `bg-gradient-to-r ${item.gradient} shadow-lg shadow-blue-200/50 text-white`
                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 text-slate-700 hover:text-blue-700"
                    }`}
                  onClick={() => hasDropdown && toggleDropdown(item.name)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Icon Container */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${isDropdownOpen || isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-gradient-to-br from-blue-100 to-cyan-100"
                      }`}
                  >
                    <div
                      className={`transition-all duration-300 ${isDropdownOpen || isActive
                          ? "text-white"
                          : "text-blue-600 group-hover:text-blue-700"
                        }`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  {/* Text */}
                  <span
                    className={`ml-3 font-semibold transition-all duration-300 ${isCollapsed && !isMobile ? "hidden" : "block"
                      } ${isDropdownOpen || isActive
                        ? "text-white"
                        : "text-slate-700 group-hover:text-blue-700"
                      }`}
                  >
                    {item.name}
                  </span>

                  {/* Dropdown Arrow */}
                  {hasDropdown && !isCollapsed && (
                    <FaChevronDown
                      className={`ml-auto text-xs transition-all duration-300 ${isDropdownOpen
                          ? "rotate-180 text-white"
                          : "text-blue-400 group-hover:text-blue-600"
                        }`}
                    />
                  )}
                </div>

                {/* Dropdown Items - NO UNDERLINES */}
                {isDropdownOpen && hasDropdown && !isCollapsed && (
                  <div className="ml-12 mt-2 space-y-1.5 animate-fadeIn">
                    {item.dropdown.map((subItem, subIdx) => (
                      <div
                        key={subIdx}
                        className={`flex items-center py-2.5 px-4 rounded-xl transition-all duration-300 cursor-pointer ${isActivePath(subItem.path)
                            ? `bg-gradient-to-r ${item.gradient} bg-opacity-10 text-blue-700 border-l-4 border-blue-500`
                            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        onClick={() => {
                          if (subItem.path) {
                            setOpenDropdown(null);
                          } else if (subItem.action) {
                            subItem.action();
                          }
                        }}
                      >
                        {/* Indicator Dot */}
                        <div
                          className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${isActivePath(subItem.path)
                              ? "bg-blue-500"
                              : "bg-blue-300 group-hover:bg-blue-400"
                            }`}
                        />

                        {/* Sub Item Content - NO UNDERLINE STYLES */}
                        {subItem.path ? (
                          <Link
                            to={subItem.path}
                            className={`flex-1 flex items-center font-medium transition-all duration-300 ${isActivePath(subItem.path)
                                ? "text-blue-700 font-semibold"
                                : "text-slate-600 hover:text-blue-700"
                              }`}
                            style={{ textDecoration: "none" }}
                          >
                            <span>{subItem.name}</span>
                            <span className="ml-auto opacity-60">
                              {subItem.icon}
                            </span>
                          </Link>
                        ) : (
                          <div
                            className={`flex-1 flex items-center font-medium cursor-pointer transition-all duration-300 ${"text-slate-600 hover:text-blue-700"
                              }`}
                            style={{ textDecoration: "none" }}
                            onClick={subItem.action}
                          >
                            <span>{subItem.name}</span>
                            <span className="ml-auto opacity-60">
                              {subItem.icon}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout Button - Separate Styling */}
        <div className="mt-6 px-4">
          <div
            className={`flex items-center py-3 px-4 rounded-2xl transition-all duration-300 cursor-pointer group ${isCollapsed && !isMobile ? "justify-center px-2" : ""
              } bg-gradient-to-r from-slate-100 to-gray-100 hover:from-red-50 hover:to-rose-100 text-slate-700 hover:text-red-600`}
            onClick={handleLogout}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100">
              <FaSignOutAlt className="text-lg text-red-500 group-hover:text-red-600" />
            </div>
            <span
              className={`ml-3 font-semibold transition-all duration-300 ${isCollapsed && !isMobile ? "hidden" : "block"
                } text-slate-700 group-hover:text-red-600`}
            >
              Logout
            </span>
          </div>
        </div>

        {/* PIXELMINDSOLUTION PVT LTD Card - Replaces Profile Card */}
        {!isCollapsed && (
          <div
            onClick={handlePixelMindClick}
            className="mt-8 p-4 bg-gradient-to-r from-white to-blue-50/80 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="font-bold text-white text-sm">P</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs font-medium text-slate-600 mb-1">
                Powered by
              </div>
              <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-700 group-hover:to-purple-700 transition-all">
                PIXELMINDSOLUTION PVT LTD
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Collapsed view - Just show P icon for PIXELMINDSOLUTION */}
      {isCollapsed && !isMobile && (
        <div
          onClick={handlePixelMindClick}
          className="p-4 border-t border-blue-100/50 flex justify-center cursor-pointer hover:bg-blue-50/50 transition-colors"
          title="Powered by PIXELMINDSOLUTION PVT LTD"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-xs">P</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;