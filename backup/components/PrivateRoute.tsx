import { Navigate } from 'react-router-dom';
import { ReactNode, FC } from 'react';

type PrivateRouteProps = {
    children: ReactNode;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children }) => {
    const isAuth = sessionStorage.getItem("auth") === "true";
    return isAuth ? <>{children}</> : <Navigate to="/login" />;
};

export default PrivateRoute;
