// components/AuthDebug.jsx
import { useSelector } from 'react-redux';

const AuthDebug = () => {
  const { token: authToken, user, roles, isAuthenticated } = useSelector((state) => state.token);
  
  return (
    <div className="fixed top-4 left-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
      <div className="bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm">
        <h3 className="font-bold mb-2 text-yellow-400">Auth Debug</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
              {isAuthenticated ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">User exists:</span>
            <span className={user ? 'text-green-400' : 'text-red-400'}>
              {user ? '✓' : '✗'}
            </span>
          </div>
          
          {user && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">User ID:</span>
                <span className="text-blue-300">{user.id || 'null'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Username:</span>
                <span className="text-purple-300">{user.username || user.userName || 'null'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Roles:</span>
                <span className="text-green-300">
                  {Array.isArray(roles) && roles.length > 0 
                    ? roles.join(', ') 
                    : 'none'}
                </span>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-400">Token type:</span>
            <span className="text-cyan-300">
              {typeof authToken}
              {typeof authToken === 'string' && authToken.length > 0 && ` (${authToken.length} chars)`}
            </span>
          </div>
          
          {authToken && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-400 mb-1">Token preview:</div>
              <div className="text-gray-300 text-xs break-all">
                {typeof authToken === 'string' 
                  ? authToken.substring(0, 30) + '...'
                  : JSON.stringify(authToken).substring(0, 30) + '...'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;