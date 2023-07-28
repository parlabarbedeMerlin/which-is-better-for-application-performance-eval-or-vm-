"use client"

export default function Home(){
  function sendping(){
    //mesure time response of ping
    var start = new Date().getTime();
    fetch('http://localhost:3000/api/calc-cp')
    .then(res => res.json())
    .then(data => {
      var end = new Date().getTime();
      var time = end - start;
      console.log(data.result);
      console.log(time);
    })
    .catch(err => {
      console.log(err);
    })
  }
  return (
    <div>
      <button onClick={sendping}>PING </button>
      <table>
        <thead>
            <tr>
                <th>VM</th>
                <th>Eval</th>
                <th>Child Process</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
  )
}