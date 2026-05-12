import { useNavigate } from 'react-router-dom';

export default function PlayerLink({ userId, username, className = '' }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userId) {
      navigate(`/user/${userId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-purple-400 hover:text-purple-300 hover:underline cursor-pointer ${className}`}
    >
      {username}
    </button>
  );
}
