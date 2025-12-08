import {React} from "react";
import { Moon, Sun } from 'react-bootstrap-icons';
import { FiSend } from "react-icons/fi";
import { LinkContainer } from 'react-router-bootstrap';

function Header(props) {
    const { activeContainer, darkMode, toggleDarkMode } = props;

    return (
        <header className="modern-header">
            <div className="header-content">
                <div className="logo-section">
                    <div className="logo-icon">S</div>
                    <LinkContainer to='/'>
                        <span className="logo-text" style={{cursor: 'pointer'}}>Suprast</span>
                    </LinkContainer>
                </div>
                
                <nav>
                    <ul className="nav-tabs">
                        <li>
                            <LinkContainer to='/category/football'>
                                <a className="nav-tab">Football</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/category/cricket'>
                                <a className="nav-tab">Cricket</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/category/rugby'>
                                <a className="nav-tab">Rugby</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/category/tennis'>
                                <a className="nav-tab">Tennis</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/category/golf'>
                                <a className="nav-tab">Golf</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/category/cycling'>
                                <a className="nav-tab">Cycling</a>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/checkbytitle'>
                                <button className="neumorphism-button">
                                    <FiSend />
                                    <span>Check News</span>
                                </button>
                            </LinkContainer>
                        </li>
                        <li>
                            <LinkContainer to='/newsquiz'>
                                <button className="neumorphism-button">
                                    <FiSend />
                                    <span>News Quiz</span>
                                </button>
                            </LinkContainer>
                        </li>
                    </ul>
                </nav>
                
                <div className="header-actions">
                    <button className="dark-mode-toggle" onClick={toggleDarkMode}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;