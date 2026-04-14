


interface Props {
  message: string;
  type?: string;
  onClose?: () => void;
}


const colorMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

const Notification: React.FC<Props> = ({ message, type = 'info', onClose }) => (
  <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow-lg ${colorMap[type]}`}
    role="alert">
    <span>{message}</span>
    {onClose && (
      <button className="ml-4 text-white font-bold" onClick={onClose}>&times;</button>
    )}
  </div>
);

export default Notification;
