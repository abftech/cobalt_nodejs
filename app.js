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
      console.time('RunSql');
      if (err) console.log(err);
      var request = new sql.Request();
      request.query(sqlQuery, function (err, recordset) {
          if (err) console.log(err);
          if (recordset === undefined) {
            res.send("");
          } else {
            res.send(recordset.recordset);
          };
          console.timeEnd('RunSql');
          console.log("RunSql Complete - finished communicating with the MPC SQL Server");
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

// firstname and lastname search for active users only
app.get('/firstlastname_search_active/:Firstname/:Lastname', function (req, res) {

    console.log("running first and last search");

    let first_name_query;
    let last_name_query;

    if (req.params.Firstname === "None"){
        first_name_query = " "
    } else
    {
        first_name_query = " and GivenNames like '" + req.params.Firstname + "%' "
    }
    if (req.params.Lastname === "None"){
        last_name_query = " "
    } else
    {
        last_name_query = " and Surname like '" + req.params.Lastname + "%' "
    }

    const str = "select TOP 11 GivenNames, Surname, ABFNumber, ClubName, EmailAddress\
      from Players, Clubs\
      where IsActive='Y'" + first_name_query + last_name_query +"\
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
    const str = "select ABFNumber, Surname, GivenNames, EmailAddress,\
                 Address1, Address2, AddressState, AddressPostcode, PhoneNumber\
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

app.get('/mpci-events', function (req, res) {
    console.log("Requested /mpci-events");
    var str = "SELECT * from Events";
    runSql(res, str)
})

app.get('/mpci-deleted-events', function (req, res) {
    console.log("Requested /mpci-deleted-events");
    var str = "SELECT * from DeletedEvents";
    runSql(res, str)
})

app.get('/mpci-GreenPointAchievementBands', function (req, res) {
    console.log("Requested /mpci-GreenPointAchievementBands");
    var str = "SELECT * from GreenPointAchievementBands";
    runSql(res, str)
})

app.get('/mpci-charge-types', function (req, res) {
    console.log("Requested /mpci-charge-type");
    var str = "SELECT * from ChargeTypes";
    runSql(res, str)
})

app.get('/mpci-batches/:min_batch_id/:max_batch_id', function (req, res) {
    console.log("Requested /mpci-batches");
    const str = "SELECT * from MPBatches where MpBatchID > " + req.params.min_batch_id + " and MPBatchID < " + req.params.max_batch_id;
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-trans/:min_tran_id/:max_tran_id', function (req, res) {
    console.log("Requested /mpci-trans");
    const str = "SELECT * from MPTrans where TranID > " + req.params.min_tran_id + " and TranID < " + req.params.max_tran_id;
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-ranks', function (req, res) {
    console.log("Requested /mpci-ranks");
    const str = "SELECT * from Ranks";
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-periods', function (req, res) {
    console.log("Requested /mpci-periods");
    const str = "SELECT * from Periods";
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-clubs', function (req, res) {
    console.log("Requested /mpci-clubs");

    // Specify fields to exclude passwords

    const str = "SELECT B4CEntitlement,\n" +
        "  B4CEntitlementBasis,\n" +
        "  B4CEntitlementBasisNextYear,\n" +
        "  B4CEntitlementNextYear,\n" +
        "  ClubEmail,\n" +
        "  ClubID,\n" +
        "  ClubName,\n" +
        "  ClubNumber,\n" +
        "  ClubSecAddress1,\n" +
        "  ClubSecAddress2,\n" +
        "  ClubSecEmail,\n" +
        "  ClubSecName,\n" +
        "  ClubSecPhone1,\n" +
        "  ClubSecPhone2,\n" +
        "  ClubWebsite,\n" +
        "  Comments,\n" +
        "  CongressMnemonic,\n" +
        "  DateAdded,\n" +
        "  DateClosed,\n" +
        "  GPACategory,\n" +
        "  IsB4cRemote,\n" +
        "  IsClosed,\n" +
        "  IsGenuineClub,\n" +
        "  IsNonChargeable,\n" +
        "  IsPaperReporting,\n" +
        "  LastLastYearGreen,\n" +
        "  LastYearGreen,\n" +
        "  LatestNotifiableEditDate,\n" +
        "  MPSecAddress1,\n" +
        "  MPSecAddress2,\n" +
        "  MPSecEmail,\n" +
        "  MPSecName,\n" +
        "  MPSecPhone1,\n" +
        "  MPSecPhone2,\n" +
        "  MembersQ1,\n" +
        "  MembersQ2,\n" +
        "  MembersQ3,\n" +
        "  MembersQ4,\n" +
        "  ShortName,\n" +
        "  VenueAddress1,\n" +
        "  VenueAddress2,\n" +
        "  VenuePostcode,\n" +
        "  VenueState,\n" +
        "  VenueSuburb\n" +
        "  from Clubs";


    console.log(str);
    runSql(res, str)
})

app.get('/mpci-players/:min_player_id/:max_player_id', function (req, res) {
    console.log("Requested /mpci-players");
    const str = "SELECT   ABFNumber\n" +
        "ABFNumberRaw ,\n" +
        "Address1 ,\n" +
        "Address2 ,\n" +
        "AddressPostcode ,\n" +
        "AddressState ,\n" +
        "Comments ,\n" +
        "DOBDay ,\n" +
        "DOBMonth ,\n" +
        "DOBYear ,\n" +
        "DateAdded ,\n" +
        "GPAThisPeriod ,\n" +
        "GPAThisYTD ,\n" +
        "Gender ,\n" +
        "GivenNames ,\n" +
        "HomeClubID ,\n" +
        "IntraGreenPeriod ,\n" +
        "IntraGreenYTD ,\n" +
        "IntraRedPeriod ,\n" +
        "IntraRedYTD ,\n" +
        "Is1000Club ,\n" +
        "IsActive ,\n" +
        "IsInactivationRequested ,\n" +
        "IsMcCutcheonEligible ,\n" +
        "IsPrinting1000ClubThisMonth ,\n" +
        "IsRankCertificateRequired ,\n" +
        "IsRegistrationCardRequired ,\n" +
        "IsUsingAlias ,\n" +
        "LastPromotionPeriodID ,\n" +
        "LastYearMPs ,\n" +
        "McCutcheonMPs ,\n" +
        "McCutcheonRank ,\n" +
        "McCutcheonState ,\n" +
        "OldAddress1 ,\n" +
        "OldAddress2 ,\n" +
        "OldAddressPostcode ,\n" +
        "OldAddressState ,\n" +
        "OldTotalGold ,\n" +
        "OldTotalGreen ,\n" +
        "OldTotalRed ,\n" +
        "OldYearStartRankID ,\n" +
        "PeriodGold ,\n" +
        "PeriodGreen ,\n" +
        "PeriodRed ,\n" +
        "PhoneNumber ,\n" +
        "PlayerID ,\n" +
        "Pre82Red ,\n" +
        "PreferredFirstName ,\n" +
        "PreviousRankID ,\n" +
        "PriorGold ,\n" +
        "PriorGreen ,\n" +
        "PriorMPs ,\n" +
        "PriorRed ,\n" +
        "Q1Gold ,\n" +
        "Q1Green ,\n" +
        "Q1Red ,\n" +
        "Q2Gold ,\n" +
        "Q2Green ,\n" +
        "Q2Red ,\n" +
        "Q3Gold ,\n" +
        "Q3Green ,\n" +
        "Q3Red ,\n" +
        "Q4Gold ,\n" +
        "Q4Green ,\n" +
        "Q4Red ,\n" +
        "QuarterGold ,\n" +
        "QuarterGreen ,\n" +
        "QuarterRed ,\n" +
        "RankID ,\n" +
        "RealName ,\n" +
        "Surname ,\n" +
        "T_PriorMPs ,\n" +
        "ThisYearMPs ,\n" +
        "Title ,\n" +
        "TotalGold ,\n" +
        "TotalGreen ,\n" +
        "TotalMPs ,\n" +
        "TotalRed ,\n" +
        "Y1Gold ,\n" +
        "Y1Green ,\n" +
        "Y1Red ,\n" +
        "Y2Gold ,\n" +
        "Y2Green ,\n" +
        "Y2Red ,\n" +
        "YearAgoGold ,\n" +
        "YearAgoGreen ,\n" +
        "YearAgoRed ,\n" +
        "YearDeletedOrInactive ,\n" +
        "YearStartRankID from Players where PlayerID > " + req.params.min_player_id + " and PlayerID < " + req.params.max_player_id;
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-promotions', function (req, res) {
    console.log("Requested /mpci-promotions");
    const str = "SELECT * from Promotions";
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-club-membership', function (req, res) {
    console.log("Requested /mpci-club-membership");
    const str = "SELECT * from ClubMembership";
    console.log(str);
    runSql(res, str)
})

app.get('/mpci-system-settings', function (req, res) {
    console.log("Requested /mpci-system-settings");
    const str = "SELECT * from SystemSettings";
    console.log(str);
    runSql(res, str)
})

app.get('/me', function (req, res) {
    const str2 = "SELECT ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH\n" +
        "       , IS_NULLABLE\n" +
        "FROM INFORMATION_SCHEMA.COLUMNS\n" +
        "WHERE TABLE_NAME = 'ClubMembership'";
    const str = "select * from Players where PlayerID = 30000";
    console.log(str);
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
