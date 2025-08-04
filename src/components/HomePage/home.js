import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAuthGuard } from "../../utils/useAuthGuard";
import Navbar from "../Navbar/navbar";

import './home.css';

const HomePage = () => {
    useAuthGuard();

    const navigate = useNavigate();



    const handleLogout = () => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        navigate("/login");
    };

    return (
        <>
            <Navbar handleLogout={handleLogout} />
            <div className="container1">


                <div className="MCQ">
                    <div className="Section">
                        <fieldset>
                            <legend>Multiple Choice Questions</legend>


                            <div className="Items">

                                <button className="item" onClick={() => navigate('../Theoretical')}>Theoretical</button>
                                <button className="item" onClick={() => navigate('../CodeAnalysis')}>Code Analysis</button>
                                {/*change the class name into item whenever the implementation of the specific route is done so the it won't display any hover text*/}
                                <button className="item" onClick={()=> navigate("../TheoreticalCodeSnippetMCQs")}>Theoretical with Code Snippet</button>
                            </div>
                        </fieldset>
                    </div>
                    <div className="Section">
                        <fieldset>
                            <legend>Coding Curation</legend>
                            <div className="Items">
                                <button className="item" onClick={()=> navigate("../ContextCoding")}>Coding</button>
                                <button className="item1">Web Coding</button>
                                <button className="item1">SQL Coding</button>
                            </div>
                        </fieldset>
                    </div>
                    <div className="Section">
                        <fieldset>
                            <legend>Coding Replication</legend>
                            <div className="Items">
                                <button className="item" onClick={() => navigate('../CodingReplication')}>Coding</button>
                                <button className="item1">Web Coding</button>
                                <button className="item1">SQL Coding</button>
                            </div>
                        </fieldset>
                    </div>
                </div>

            </div>

        </>
    );
};

export default HomePage;
