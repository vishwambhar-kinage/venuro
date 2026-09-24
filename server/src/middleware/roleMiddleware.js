/**
 * Role-Based Access Control (RBAC) Middleware
 * Normalizes role aliases:
 * - 'customer' <-> 'user'
 * - 'organizer' <-> 'coordinator'
 * - 'admin'
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before accessing this resource.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    
    // Normalize aliases
    const normalizedUserRole = userRole === 'user' ? 'customer' : (userRole === 'coordinator' ? 'organizer' : userRole);

    const isAllowed = allowedRoles.some(allowed => {
      const normAllowed = allowed.toLowerCase() === 'user' ? 'customer' : (allowed.toLowerCase() === 'coordinator' ? 'organizer' : allowed.toLowerCase());
      return normAllowed === normalizedUserRole || allowed.toLowerCase() === userRole;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};
