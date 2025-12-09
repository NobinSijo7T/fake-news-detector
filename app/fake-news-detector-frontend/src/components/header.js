import {React} from "react";
import { Moon, Sun, Newspaper } from 'react-bootstrap-icons';
import { FiSend } from "react-icons/fi";
import { LinkContainer } from 'react-router-bootstrap';

function Header(props) {
    const { darkMode, toggleDarkMode } = props;

    return (
        <header className="modern-header">
            <div className="header-content">
                <div className="logo-section">
                    <img src="/logo.png" alt="News Guardian Logo" className="logo-image" />
                    <LinkContainer to='/'>
                        <span className="logo-text" style={{cursor: 'pointer'}}>News Guardian</span>
                    </LinkContainer>
                </div>
                
                <div className="header-actions">
                    <LinkContainer to='/all-news'>
                        <button className="neumorphism-button">
                            <Newspaper />
                            <span>All News</span>
                        </button>
                    </LinkContainer>
                    <LinkContainer to='/checkbytitle'>
                        <button className="neumorphism-button">
                            <FiSend />
                            <span>Check News</span>
                        </button>
                    </LinkContainer>
                    <LinkContainer to='/newsquiz'>
                        <button className="neumorphism-button">
                            <FiSend />
                            <span>News Quiz</span>
                        </button>
                    </LinkContainer>
                    <button className="dark-mode-toggle" onClick={toggleDarkMode}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;