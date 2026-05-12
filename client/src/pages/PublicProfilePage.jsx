import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/users/${userId}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-4">
        <p>User not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-20">
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <img
          src={`/assets/${user.profilePicture || 'Charakter_1'}.png`}
          alt={user.username}
          className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
        />
        <h1 className="text-2xl font-bold text-white">{user.username}</h1>
        <p className="text-gray-400 text-sm mt-2">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}
