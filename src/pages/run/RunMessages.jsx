import React, { useEffect, useState } from "react";
import axiosInstance from "../../lib/axios";
import { format } from "date-fns";
import { Search } from "lucide-react";

const RunMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get("/api/admin/messages-clear");
        setMessages(res.data.data.messages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Monitor</h1>
          <p className="text-gray-500 mt-1">Clear-text view of E2E encrypted messages</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          Live Monitoring Active
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clear text messages..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <th className="p-4 font-semibold text-gray-600 text-sm w-48">Timestamp</th>
                <th className="p-4 font-semibold text-gray-600 text-sm w-48">Sender</th>
                <th className="p-4 font-semibold text-gray-600 text-sm w-48">Receiver</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Decrypted Content</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(msg.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender?.username}`}
                        className="w-6 h-6 rounded-full"
                        alt=""
                      />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {msg.sender?.username}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={msg.receiver?.profileImage || `https://ui-avatars.com/api/?name=${msg.receiver?.username}`}
                        className="w-6 h-6 rounded-full"
                        alt=""
                      />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                        {msg.receiver?.username}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 font-mono">
                      {msg.type === "text" ? (
                        msg.content || <span className="italic text-gray-400">Empty</span>
                      ) : (
                        <span className="flex items-center gap-2 text-blue-600 font-sans">
                          [{msg.type.toUpperCase()}] {msg.fileName || "File attached"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No messages found or unauthorized.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RunMessages;
