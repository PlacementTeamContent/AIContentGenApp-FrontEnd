import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./login.css";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentEmoji, setCurrentEmoji] = useState("🚀");
    const navigate = useNavigate();

    // Fun loading emojis sequence
    const loadingEmojis = ["🚀", "✨", "🎉", "🌟", "⭐", "💫", "🔥", "🎊", "🌈", "🦄"];
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

    return (
        <form onSubmit={handleLogin}>
            <div className="container">
                <div className="login">
                    <fieldset>
                        <legend>Login</legend>

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
                                    <div className="loading-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        /><br />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        /><br />
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
                    </fieldset>
                </div>
            </div>
        </form>
    );
};

export default LoginForm;