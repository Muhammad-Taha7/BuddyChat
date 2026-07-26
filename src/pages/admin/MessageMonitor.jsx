import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import {
  Shield,
  File,
  Mic,
  Image as ImageIcon,
  Type,
  Loader2,
  Activity,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MessageMonitor = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get("/api/admin/messages");
        setMessages(res.data.data.messages);
      } catch (error) {
        toast.error("Failed to load message metadata");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case "image":
        return <ImageIcon size={15} className="text-sky-400" />;
      case "file":
        return <File size={15} className="text-purple-400" />;
      case "voice":
        return <Mic size={15} className="text-amber-400" />;
      default:
        return <Type size={15} className="text-gray-500" />;
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn text-gray-900">
      {/* Top Header & E2E Security Notice */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Activity className="text-[#fc4a56]" size={26} />
            Message Monitor
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400 shrink-0" />
            Content is End-to-End Encrypted and invisible to administrators. Showing metadata only.
          </p>
        </div>
      </div>

      {/* Admin Messages Metadata Table */}
      <div className="w-full overflow-hidden rounded-2xl bg-gray-50/60 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/30">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 space-y-3">
            <Loader2 className="animate-spin text-[#fc4a56]" size={32} />
            <span className="text-sm">Loading message logs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              {/* Table Head */}
              <thead className="bg-white/70 text-gray-500 text-xs uppercase font-semibold tracking-wider border-b border-gray-200/80">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Message ID
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Sender
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Receiver
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Timestamp
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/60">
                {messages.map((msg) => (
                  <tr
                    key={msg._id}
                    className="hover:bg-gray-100/40 transition-colors duration-150"
                  >
                    {/* Message Identifier */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {msg._id.substring(0, 8)}...
                    </td>

                    {/* Sender Handle */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      @{msg.sender?.username || "unknown"}
                    </td>

                    {/* Receiver Handle */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      @{msg.receiver?.username || "unknown"}
                    </td>

                    {/* Payload Type */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100/80 border border-gray-300/50 text-xs text-gray-700 capitalize">
                        {getTypeIcon(msg.type)}
                        <span>{msg.type}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {msg.isRead ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-300/60">
                          Delivered
                        </span>
                      )}
                    </td>

                    {/* Date/Time */}
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {messages.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No message metadata available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageMonitor;