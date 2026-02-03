import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, allowedRoles }) {
  const { token, roles } = useSelector((state) => state.token);

  // Проверяем наличие токена
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Проверяем, есть ли у пользователя хотя бы одна из разрешенных ролей
  const hasAccess = allowedRoles ? roles.some((role) => allowedRoles.includes(role)) : true;

  if (!hasAccess) {
    return <Navigate to="/home" />;
  }

  return children;
}

export default PrivateRoute;