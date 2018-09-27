import React from 'react';
import fetch from 'isomorphic-fetch';

class Top10 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Top10: [],
            order: 1
        }
    }
    async componentDidMount() {
        fetch('http://45.76.50.213:3001/movie/getTopTen')
            .then((response) => {
                console.log(response);
                return response.json();
            })
            .catch((e) => {
                console.log(e);
            })
            .then((message) => {
                console.log(message);
                this.setState({
                    Top10: message
                })
            })
    }
    render() {
        return (
            <section className="p-0" id="Top10">
                <div className="container-fluid p-0">
                    <div className="col-lg-8 mx-auto text-center">
                        <h2 className="section-heading">Top rated movies</h2>
                        <hr className="my-4" />
                    </div>
                    <div className="row no-gutters popup-gallery">
                        {this.state.Top10.slice().map((x) =>
                            <div className="col-lg-3 col-sm-4" key={x.name}>
                            {/* <a href={`./MovieDetail/` + x._id}>{x.name}</a> */}
                                <a className="portfolio-box" href={`../processedposters/` + x.poster}>
                                    <img className="img-fluid" src={`../processedposters/` + x.poster} alt={x.name} />
                                    <div className="portfolio-box-caption">
                                        <div className="portfolio-box-caption-content">
                                            <div className="project-category text-faded">
                                                # {this.state.order++}
                                            </div>
                                            <div className="project-name">
                                                {x.name}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                            // <div class="card" >
                            //     <a href={`./MovieDetail/` + x._id} class="card-title"><img class="card-img-top" src={`../processedposters/` + x.poster} alt={x.name} height="450"/></a>
                            // </div>
                        )}
                    </div>
                </div>
            </section>
        )
    }
}
export default Top10;