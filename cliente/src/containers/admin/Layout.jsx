import React from 'react';
import Header from '../../components/HeaderAdmin';

const Layout = ({ children }) => {
    return (
        <>
            <Header />
            <main>{children}</main>
        </>

    )
}

export default Layout