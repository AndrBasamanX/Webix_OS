export default function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? '' : 'hidden'}`}>
      <i className="fa-solid fa-bell"></i>
      <span>{message}</span>
    </div>
  );
}

