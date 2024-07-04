# fare evasion
## category
web

## points
370

## description
### challenge description
![](images/challenge.png)

### challenge webpage
![](images/homepage.png)

## information gathering
- goal is to pass as a conductor
- on clicking the pay button, you can pass as a passenger, but currently passengers are disallowed
    so it shows an error
- the error discloses the passenger signing key
![](images/error.png)
- on looking at the request in burp, we see that a cookie is passed with access token set that
    looks like a JWT token
![](images/burp-passenger.png)

- in the source of the homepage, we also see some commented out sql code:
```
async function pay() {
      // i could not get sqlite to work on the frontend :(
      /*
        db.each(`SELECT * FROM keys WHERE kid = '${md5(headerKid)}'`, (err, row) => {
        ???????
       */
      const r = await fetch("/pay", { method: "POST" });
      const j = await r.json();
      document.getElementById("alert").classList.add("opacity-100");
      // todo: convert md5 to hex string instead of latin1??
      document.getElementById("alert").innerText = j["message"];
      setTimeout(() => { document.getElementById("alert").classList.remove("opacity-100") }, 5000);
    }
```
- there's also a todo that implies that currently the md5 hashes are being generated in `latin1`
    encoding instead of the hex string that we usually think of when we see hashes

## exploitation
- the default jwt token:
```
eyJhbGciOiJIUzI1NiIsImtpZCI6InBhc3Nlbmdlcl9rZXkiLCJ0eXAiOiJKV1QifQ.eyJ0eXBlIjoicGFzc2VuZ2VyIn0.EqwTzKXS85U_CbNznSxBz8qA1mDZOs1JomTXSbsw0Zs
```
- on decoding the default jwt token, we get the following fields:
```
header
{
  "alg": "HS256",
  "kid": "passenger_key",
  "typ": "JWT"
}
payload
{
  "type": "passenger"
}
```
- the default jwt token from above only has a valid signature if you provide the signing key
	as the one obtained from the error above: `a_boring_passenger_signing_key_?`
![](images/jwt-token.png)
- thus, our goal now is to obtain the conductor passenger key somehow so we can change the jwt token
	and then make it valid by using the conductor signing key
- the sql code seems to md5 hash the kid field from the header. if we can control the md5 hash 
	output, there could be a possibility of sql injection which can help us get the conductor 
    signing key
- on searching for it, found this [post](https://cvk.posthaven.com/sql-injection-with-raw-md5-hashes)
    which describes a ctf challenge where sql injection was done with md5 hashes
- we're assuming from the leaked sql query and source from earlier that the md5 hashes are being
    output in latin1 encoding instead of hex, thus if we're able to find a string that when 
    md5 hashed and output in latin1 encoding has similar semantic meaning as the sql injection
    query: `'OR '1'='1'--`
- on md5 hashing the `headerKid` (`passenger_key`) and comparing it with the obtained latin1 hex
    encode of the error, we see a lot of similarities
![](images/pattern.png)
- likely, what is happening in the background is that the input text given in header_kid is being
    md5 hashed but the format is set to 'latin1', similar to below code
![](images/encoding.png)
- this is confirmed by seeing the same output when the pay button is clicked and error is seen
![](images/error.png)
- thus, we're on the right track. 
    we need to find a string that when md5 hashed in 'latin1' format, gives us an sql injection attack
- goal: <string> --> `md5('<string>', format='latin1')` --> `'or 1=1`
- the [article](https://cvk.posthaven.com/sql-injection-with-raw-md5-hashes) mentioned above has 
    already done this job for us. testing the given string from the article:
![](images/payload.png)
![](images/jwt-payload.png)
![](images/burp-payload.png)

- it works! we're able to succesfully obtain the conductor key as seen above
- changing the header_kid to "conductor_key", generating the signed jwt token (`a`) using the new 
    conductor secret, we get the flag!
![](images/exploitation-jwt.png)
![](images/exploitation-burp.png)

## flag
`uiuctf{sigpwny_does_not_condone_turnstile_hopping!}`
