import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./login.css";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentEmoji, setCurrentEmoji] = useState("🚀");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Fun loading emojis sequence
    
    
    const loadingMessages = [
        "Preparing your space...",
        "Sprinkling magic dust...",
        "Almost there...",
        "Loading awesomeness...",
        "Getting things ready...",
        "Just a moment..."
    ];

    // 🔁 Redirect if already authenticated
    useEffect(() => {
        const accessToken = Cookies.get("accessToken");
        if (accessToken) {
            navigate("/"); // Redirect to home page
        }
    }, [navigate]);

    // Emoji animation effect during loading
    useEffect(() => {
        const loadingEmojis = ["🚀", "✨", "🎉", "🌟", "⭐", "💫", "🔥", "🎊", "🌈", "🦄"];
        let emojiInterval;
        if (isLoading) {
            emojiInterval = setInterval(() => {
                setCurrentEmoji(prev => {
                    const currentIndex = loadingEmojis.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingEmojis.length;
                    return loadingEmojis[nextIndex];
                });
            }, 300); // Change emoji every 300ms
        }
        return () => clearInterval(emojiInterval);
    }, [isLoading]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("https://ravik00111110.pythonanywhere.com/api/auth/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error("Invalid credentials or CORS error");
            }

            const data = await response.json();
            Cookies.set("accessToken", data.access, { expires: 1 });
            Cookies.set("refreshToken", data.refresh, { expires: 7 });

            // Show success animation before navigating
            setCurrentEmoji("🎉");
            setTimeout(() => {
                navigate("/");
            }, 800);

        } catch (error) {
            setIsLoading(false);
            alert("Login failed: " + error.message);
        }
    };

    const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
    

    return (
        <form onSubmit={handleLogin}>
            <div className="container">
                <div className="login">
                        <h1 className="login-heading">Login</h1>

                        {/* Loading Animation Overlay */}
                        {isLoading && (
                            <div className="loading-overlay">
                                <div className="loading-content">
                                    <div className="emoji-spinner">
                                        <span className="loading-emoji">{currentEmoji}</span>
                                    </div>
                                    <p className="loading-message">
                                        {loadingMessages[Math.floor(Math.random() * loadingMessages.length)]}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <label>User Name</label>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <label>Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <div className="show-password">
                            <span onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                            {showPassword ? <p><span className="pass"><FiEyeOff /></span>Hide Password</p> : <p><span className="pass"><FiEye /></span>Show Password</p>}
                        </span>
                        </div>
                        <br />
                        <button
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="button-emoji">{currentEmoji}</span>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                </div>
            </div>
        </form>
    );
};

export default LoginForm;