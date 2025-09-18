// src/components/AuctionForm.tsx

import React, { useEffect, useState } from 'react';
import api from "@/lib/axios";
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { X, XCircle, XCircleIcon } from 'lucide-react';

const BroadcastForm = () => {
    const [title, setTitle] = useState('');
    const [auctionId, setAuctionId] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [description,setDescription]=useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [auctionOptions, setAuctionOptions] = useState<any[]>([]); // Store auction ID options
    const [broadcasts, setBroadcasts] = useState<[]>([]);
    const [processingBroadcastId, setProcessingBroadcastId] = useState<number | null>(
        null
    );
const handleDelete = async (id: number) => {
        setProcessingBroadcastId(id);
        try {
            // Call the API to reject the user
            const response = await api.delete(`/api/admin/broadcast/${id}`);
            console.log(response.data);
            if (response.data && response.status === 200) {
                toast.success(response.data.message);
                fetchBroadcasts();
                fetchAuctionIds();
            }
        } catch (error) {
            console.error("Error rejecting user:", error);
            toast.error("فشل الحذف ");

        } finally {
            setProcessingBroadcastId(null);
        }
    };

                  const fetchBroadcasts = async () => {
            try {
                const response = await api.get('/api/admin/all-broadcasts');
                const all_broadcasts=response.data.data.data || response.data.data; // Replace with your actual API endpoint
                 console.log(all_broadcasts);
                setBroadcasts(all_broadcasts);
            } catch (err) {
                setError('Failed to load auction IDs');
            }
        };

               const fetchAuctionIds = async () => {
            try {
                const response = await api.get('/api/approved-auctions-ids');
                const auctions=response.data.data.data || response.data.data; // Replace with your actual API endpoint
                console.log(auctions);
                setAuctionOptions(auctions.filter(a => a.broadcasts.length == 0)); // Assuming the response is an array of auction objects with 'id' and 'name'
            } catch (err) {
                setError('Failed to load auction IDs');
            }
        };
       // Fetch auction IDs from API on component mount
    useEffect(() => {

        fetchBroadcasts();
        fetchAuctionIds();
    }, []);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const auction_data = auctionOptions.filter(a => a.id == auctionId); // Assuming the response is an array of auction objects with 'id' and 'name'
        const result=`${auction_data[0].car.make} ${auction_data[0].car.model} ${auction_data[0].car.year }`
       const formData = {
            title,
            auction_id: auctionId,
            stream_url: youtubeUrl,
            description:result
        };
        try {
            const response = await api.post('/api/admin/broadcast', formData);
            setSuccess(response.data.message);
            fetchBroadcasts();
            fetchAuctionIds();
            setError(null); // Reset error message
        } catch (error: any) {
            setError(error.response?.data?.message || 'Something went wrong');
            setSuccess(null); // Reset success message
        }
    };

    return (
     <><div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء بث مباشر</h2>
                <p className="text-gray-600">من فضلك، أدخل التفاصيل التالية لبدء البث المباشر.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Field */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        العنوان
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="أدخل العنوان" />
                </div>

                {/* Auction ID Dropdown */}
                <div>
                    <label htmlFor="auction_id" className="block text-sm font-medium text-gray-700">
                        رقم المزاد
                    </label>
                    <select
                        id="auction_id"
                        value={auctionId}
                        onChange={(e) => setAuctionId(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option defaultValue=""  >اختر رقم المزاد</option>
                        {auctionOptions.map((auction) => (
                            <option key={auction.id} value={auction.id}>
                                {auction.car.make} {auction.car.model} {auction.car.year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* YouTube URL Field */}
                <div>
                    <label htmlFor="stream_url" className="block text-sm font-medium text-gray-700">
                        رابط يوتيوب
                    </label>
                    <input
                        type="url"
                        id="stream_url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="أدخل رابط يوتيوب" />
                </div>

                {/* Description Field */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        الوصف
                    </label>
                    <input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="أدخل الوصف" />
                </div>

                {/* Submit Button */}
                <div className="text-center mt-6">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    >
                        إرسال
                    </button>
                </div>
            </form>

            {/* Error and Success Messages */}
            {error && <div className="text-red-500 mt-4">{error}</div>}
            {success && <div className="text-green-500 mt-4">{success}</div>}
        </div><div className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
      
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    عنوان
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    وصف
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    رابط البث
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    الإجراءات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {broadcasts.length > 0 ? (
                                broadcasts.map((broadcast) => (
                                    <tr
                                        key={broadcast.id}
                                        className="hover:bg-gray-50"
                                    >
    
      <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {broadcast.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {broadcast.description}
                                            </div>
                                        </td>
                                                           <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                               <a href={broadcast.stream_url} target="_blank" rel="noopener noreferrer">
                                                رابط
                                                </a>
                                            </div>
                                        </td>

                                        <td>
                                            <Button
                                                        onClick={() =>
                                                            handleDelete(
                                                                broadcast.id
                                                            )
                                                        }
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        <XCircleIcon className="w-4 h-4 ml-1 text-red-600" />
                                                    </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        لا توجد نتائج مطابقة للبحث
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div></>
    );
};

export default BroadcastForm;
