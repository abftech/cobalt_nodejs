var express = require('express');
var app = express();

function runSql(res, sqlQuery) {
  var sql = require('mssql');

  var config = {
      user:       process.env.DB_USER           || 'admin',
      password:   process.env.DB_PASSWORD       || 'F1shcake',
      server:     process.env.DB_SERVER         || 'mps.abftech.com.au',
      database:   process.env.DB_DATABASE       || 'abfmpc_db',
      port:       parseInt(process.env.DB_PORT) ||  1433,
      options: {
        encrypt: false,
        enableArithAbort: true
      }
  };

  sql.connect(config, function (err) {
      if (err) console.log(err);
      var request = new sql.Request();
      request.query(sqlQuery, function (err, recordset) {
          if (err) console.log(err);
          if (recordset === undefined) {
            res.send("");
          } else {
            res.send(recordset.recordset);
          }
      });
  });
}

// Basic id search
app.get('/id/:userId', function (req, res) {
    console.log("Requested /id");
    var str = "select GivenNames, Surname, IsActive from Players, Ranks\
     where ABFNumber=" + req.params.userId +"\
     and Players.RankID = Ranks.RankID";
    runSql(res, str)
})

// Basic lastname search
app.get('/lastname_search/:Surname', function (req, res) {
    console.log("Requested /lastname");
    var str = "select GivenNames, Surname, IsActive, ABFNumber, RankName, ClubName\
      from Players, Ranks, Clubs\
      where Surname like '" + req.params.Surname + "%'\
      and Players.RankID = Ranks.RankID\
      and Clubs.ClubID=Players.HomeClubID\
      order by GivenNames";

    runSql(res, str);
})

// Basic firstname search
app.get('/firstname_search/:Firstname', function (req, res) {
    console.log("Requested /firstname");
    var str = "select GivenNames, Surname, IsActive, ABFNumber, RankName, ClubName\
      from Players, Ranks, Clubs\
      where GivenNames like '" + req.params.Firstname + "%'\
      and Players.RankID = Ranks.RankID\
      and Clubs.ClubID=Players.HomeClubID\
      order by Surname";

    runSql(res, str);
})

// Basic firstname and lastname search
app.get('/firstlastname_search/:Firstname/:Lastname', function (req, res) {
    console.log("Requested /firstlastname");
    var str = "select GivenNames, Surname, IsActive, ABFNumber, RankName, ClubName\
      from Players, Ranks, Clubs\
      where GivenNames like '" + req.params.Firstname + "%'\
      and Surname like '" + req.params.Lastname + "%'\
      and Players.RankID = Ranks.RankID\
      and Clubs.ClubID=Players.HomeClubID\
      order by Surname, GivenNames";

    runSql(res, str);
})

// Club name from id
app.get('/club/:clubId', function (req, res) {
    console.log("Requested /club");
    var str = "select ClubName from Clubs where ClubID=" + req.params.clubId;
    runSql(res, str)
})

// detailed MP postings by ABF number with date range
app.get('/mpdetail/:userId/postingyear/:reqYear/postingmonth/:reqMonth', function (req, res) {
    console.log("Requested /mpdetail");
    period = parseInt(req.params.reqYear) * 100 + parseInt(req.params.reqMonth);
    var str = "select mps, EventDescription, EventCode, MPColour, PostingYear, PostingMonth\
      from viewPlayerTrans\
      where ABFNumber=" + req.params.userId + "\
      and (PostingYear > " + req.params.reqYear + "\
      OR (PostingYear = " + req.params.reqYear + " AND PostingMonth >= " + req.params.reqMonth + " ))\
      order by PostingYear DESC, PostingMonth DESC";
    console.log(str);
    runSql(res, str);
})

// Summary details by ABF number
app.get('/mps/:userId', function (req, res) {
    console.log("Requested /mps");
    var str = "select PlayerID, ABFNumber, Surname, GivenNames, HomeClubID,\
      IsActive, TotalMPs, TotalGold, TotalRed, TotalGreen, RankName \
      FROM Players, Ranks\
      where ABFNumber = " + req.params.userId + "\
      and Players.RankID = Ranks.RankID";
    runSql(res, str)
})

// Club Details by Club Number
app.get('/clubDetails/:clubNumber', function (req, res) {
    console.log("Requested /mps");
    var str = "select ClubName, ClubEmail, ClubWebsite,\
       MPSecName, MPSecAddress1, MPSecAddress2, MPSecEmail, MPSecPhone1, MPSecPhone2,\
       ClubSecName, ClubSecAddress1, ClubSecAddress2, ClubSecEmail, ClubSecPhone1, ClubSecPhone2,\
       VenueAddress1, VenueAddress2, VenueSuburb, VenueState, VenuePostcode,  LatestNotifiableEditDate\
       from clubs\
       where clubNumber = " + req.params.clubNumber;

    runSql(res, str)
})

// Club name search - get top 11 matches
app.get('/clubNameSearch/:clubNameSearch', function (req, res) {
    console.log("Requested /clubNameSearch");
    var str = "SELECT TOP 11 ClubName, ClubNumber from Clubs\
                where ClubName like '" + req.params.clubNameSearch + "%'\
                order by ClubName";
    console.log(str);
    runSql(res, str)
})

// Home club members for a given club number
app.get('/clubMemberList/:clubNumber', function (req, res) {
    console.log("Requested /clubMemberList");
    const str = "select ABFNumber, Surname, GivenNames, EmailAddress\
                 from Players, Clubs\
                 where Players.HomeClubID = Clubs.ClubID\
                 and Players.IsActive = 'Y'\
                 and clubs.ClubNumber = " + req.params.clubNumber;
    console.log(str);
    runSql(res, str)
})

app.get('/tmp', function (req, res) {
    console.log("Requested /tmp");
    var str = "SELECT VariableValue AS ThisValue FROM SystemSettings WHERE VariableName = 'CurrentPeriodID'";
    runSql(res, str)
})

app.get('/provisionaldate', function(req, res) {
// returns the current year and month, anything earlier is confirmed, the same or later is provisional

  // set up connection
  var sql = require('mssql');

  var config = {
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'F1shcake',
    server: process.env.DB_SERVER || 'mps.abftech.com.au',
    database: process.env.DB_DATABASE || 'abfmpc_db',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
      encrypt: false,
      enableArithAbort: true
    }
  };

  sql.connect(config, function(err) {

    if (err) console.log(err);

    var request = new sql.Request();

    // get currrent period so we can differentiate between confirmed and provisional points
    // current period = provisional points

    var sqlQuery = "SELECT VariableValue AS CurrentPeriodID FROM SystemSettings WHERE VariableName = 'CurrentPeriodID'";

    request.query(sqlQuery, function(err, recordset) {

      if (err) console.log(err);

      if (recordset === undefined) {

        res.send("");

      } else {

        var periodID = parseInt(recordset.recordset[0]['CurrentPeriodID']);

        // now get the year and month

        var sqlQuery2 = "SELECT PeriodEnd FROM Periods WHERE PeriodID = " + periodID;

        request.query(sqlQuery2, function(err, recordset) {

          if (err) console.log(err);

          if (recordset === undefined) {

            res.send("");

          } else {

            var activeDate = recordset.recordset[0]['PeriodEnd'];
// set timezone on date
            var ozDate = new Date(activeDate.toLocaleString('en-US', {
                timeZone: 'Australia/Sydney'
            }));

            var year = ozDate.getFullYear();
            var month = ozDate.getMonth();

            res.send('[{"year":' + year + ', "month":' + month + ', "periodID": ' + periodID + '}]');

          }
        });
      }
    });
  });
});

module.exports = app;
var server = app.listen(8081, function () {
     console.log('Server is running...');
 });
