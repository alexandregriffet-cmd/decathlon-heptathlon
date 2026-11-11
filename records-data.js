/* Base de records DÉCATHLON. Unités du moteur : secondes (courses), cm (hauteur, perche, longueur), m (lancers).
   Ligne : [marque, athlète, nation, date ISO ou '', lieu, note]. Clé : sexe|[i:]épreuve (i: = salle).
   Sources : Track & Field News (records du monde extérieur/salle, au 24 juillet 2026 et 24 octobre 2026), Wikipedia (listes de records européens
   et d'Amérique du Nord, meilleures marques en décathlon / heptathlon). Le vent n'est pas pris en compte dans le jeu. */
(function(root){
const R={
/* record du monde de l'épreuve, toutes épreuves confondues */
W:{
 'M|100':[9.58,'Usain Bolt','Jamaïque','2009-08-16','Berlin'],
 'M|lj':[895,'Mike Powell','États-Unis','1991-08-30','Tokyo'],
 'M|sp':[23.56,'Ryan Crouser','États-Unis','2023-05-27','Westwood'],
 'M|hj':[245,'Javier Sotomayor','Cuba','1993-07-27','Salamanque'],
 'M|400':[43.03,'Wayde van Niekerk','Afrique du Sud','2016-08-14','Rio de Janeiro'],
 'M|110h':[12.75,'Ja’Kobe Tharp','États-Unis','2026-06-10','Eugene'],
 'M|dt':[75.56,'Mykolas Alekna','Lituanie','2025-04-13','Ramona'],
 'M|pv':[630,'Armand Duplantis','Suède','2025-09-15','Tokyo','record du monde en plein air (6,31 m en salle)'],
 'M|jt':[98.48,'Jan Železný','République tchèque','1996-05-25','Iéna'],
 'M|1500':[206.00,'Hicham El Guerrouj','Maroc','1998-07-14','Rome'],
 'F|100h':[12.12,'Tobi Amusan','Nigeria','2022-07-24','Eugene'],
 'F|hj':[210,'Yaroslava Mahuchikh','Ukraine','2024-07-07','Paris'],
 'F|sp':[22.63,'Natalya Lisovskaya','URSS','1987-06-07','Moscou'],
 'F|200':[21.34,'Florence Griffith Joyner','États-Unis','1988-09-29','Séoul'],
 'F|lj':[752,'Galina Chistyakova','URSS','1988-06-11','Léningrad'],
 'F|jt':[72.28,'Barbora Špotáková','République tchèque','2008-09-13','Stuttgart'],
 'F|800':[113.28,'Jarmila Kratochvílová','Tchécoslovaquie','1983-07-26','Munich'],
 'F|100':[10.49,'Florence Griffith Joyner','États-Unis','1988-07-16','Indianapolis'],
 'F|400':[47.60,'Marita Koch','RDA','1985-10-06','Canberra'],
 'F|1500':[228.68,'Faith Kipyegon','Kenya','2025-07-05','Eugene'],
 'F|dt':[76.80,'Gabriele Reinsch','RDA','1988-07-09','Neubrandenburg'],
 'F|pv':[506,'Yelena Isinbaeva','Russie','2009-08-28','Zurich'],
 'M|200':[19.19,'Usain Bolt','Jamaïque','2009-08-20','Berlin'],
 'M|800':[100.91,'David Rudisha','Kenya','2012-08-09','Londres'],
 /* salle */
 'M|i:60':[6.34,'Christian Coleman','États-Unis','2018-02-18','Albuquerque'],
 'M|i:60h':[7.27,'Grant Holloway','États-Unis','2024-02-16','Albuquerque'],
 'M|i:lj':[879,'Carl Lewis','États-Unis','1984-01-27','New York'],
 'M|i:sp':[22.82,'Ryan Crouser','États-Unis','2021-01-24','Fayetteville'],
 'M|i:hj':[243,'Javier Sotomayor','Cuba','1989-03-04','Budapest'],
 'M|i:pv':[631,'Armand Duplantis','Suède','2026-03-12','Uppsala'],
 'M|i:1000':[134.20,'Ayanleh Souleiman','Djibouti','2016-02-17','Stockholm'],
 'F|i:60h':[7.65,'Devynne Charlton','Bahamas','2024-03-03','Glasgow'],
 'F|i:hj':[208,'Kajsa Bergqvist','Suède','2006-02-04','Arnstadt'],
 'F|i:sp':[22.50,'Helena Fibingerová','Tchécoslovaquie','1977-02-19','Jablonec'],
 'F|i:lj':[737,'Heike Drechsler','RDA','1988-02-13','Vienne'],
 'F|i:800':[115.82,'Jolanda Čeplak','Slovénie','2002-03-03','Vienne']
},
/* meilleure marque réalisée au sein d'un décathlon / heptathlon */
WB:{
 'M|100':[10.12,'Damian Warner','Canada','2019-05-25','Götzis'],
 'M|lj':[845,'Simon Ehammer','Suisse','2022-05-28','Götzis'],
 'M|sp':[19.17,'Edy Hubacher','Suisse','1969-10-05','Berne'],
 'M|hj':[228,'Derek Drouin','Canada','2017-04-07','Santa Barbara'],
 'M|400':[45.00,'Ashton Eaton','États-Unis','2015-08-28','Pékin'],
 'M|110h':[13.36,'Damian Warner','Canada','2021-05-30','Götzis'],
 'M|dt':[57.70,'Leo Neugebauer','Allemagne','2024-06-06','Eugene'],
 'M|pv':[576,'Tim Lobinger','Allemagne','1999-09-16','Leverkusen'],
 'M|jt':[79.80,'Peter Blank','Allemagne','1992-07-19','Emmelshausen'],
 'M|1500':[238.7,'Robert Baker','États-Unis','1980-04-03','Austin','chrono manuel'],
 'F|100h':[12.54,'Jessica Ennis','Royaume-Uni','2012-08-03','Londres'],
 'F|hj':[202,'Nafissatou Thiam','Belgique','2019-06-22','Talence'],
 'F|sp':[17.31,'Austra Skujytė','Lituanie','','','date non confirmée'],
 'F|200':[22.30,'Jackie Joyner-Kersee','États-Unis','1988-09-23','Séoul'],
 'F|lj':[727,'Jackie Joyner-Kersee','États-Unis','1988-09-24','Séoul'],
 'F|jt':[60.90,'Barbora Špotáková','République tchèque','','','date non confirmée'],
 'F|800':[121.84,'Nadine Debois','','','','date non confirmée']
},
/* total de points : décathlon, heptathlon, salle */
TOT:{
 W:{DEC:[9126,'Kevin Mayer','France','2018-09-16','Talence'],HEP:[7291,'Jackie Joyner-Kersee','États-Unis','1988-09-24','Séoul'],
    HEPI:[6670,'Simon Ehammer','Suisse','2026-03-21','Toruń'],PENI:[5055,'Nafissatou Thiam','Belgique','2023-03-03','Istanbul']},
 EUR:{DEC:[9126,'Kevin Mayer','France','2018-09-16','Talence'],HEP:[7032,'Carolina Klüft','Suède','2007-08-26','Osaka'],
    HEPI:[6670,'Simon Ehammer','Suisse','2026-03-21','Toruń'],PENI:[5055,'Nafissatou Thiam','Belgique','2023-03-03','Istanbul']},
 NAM:{DEC:[9045,'Ashton Eaton','États-Unis','2015-08-29','Pékin'],HEP:[7291,'Jackie Joyner-Kersee','États-Unis','1988-09-24','Séoul']}
},
/* records continentaux (plein air) : EUR = Europe, NAM = Amérique du Nord, centrale et Caraïbes (USA, Canada, Jamaïque, Cuba, Grenade…) */
C:{
 EUR:{
  'M|100':[9.80,'Marcell Jacobs','Italie','2021-08-01','Tokyo'],'M|400':[43.44,'Matthew Hudson-Smith','Royaume-Uni','2024-08-07','Paris'],
  'M|110h':[12.91,'Colin Jackson','Royaume-Uni','1993-08-20','Stuttgart'],'M|hj':[242,'Patrik Sjöberg','Suède','1987-06-30','Stockholm'],
  'M|pv':[630,'Armand Duplantis','Suède','2025-09-15','Tokyo'],'M|lj':[886,'Robert Emmiyan','URSS','1987-05-22','Tsakhkadzor','en altitude'],
  'M|sp':[23.06,'Ulf Timmermann','RDA','1988-05-22','Chania'],'M|dt':[75.56,'Mykolas Alekna','Lituanie','2025-04-13','Ramona'],
  'M|jt':[98.48,'Jan Železný','République tchèque','1996-05-25','Iéna'],'M|1500':[206.73,'Jakob Ingebrigtsen','Norvège','2024-07-12','Paris'],
  'F|100':[10.73,'Christine Arron','France','1998-08-19','Budapest'],'F|200':[21.63,'Dafne Schippers','Pays-Bas','2015-08-28','Pékin'],
  'F|400':[47.60,'Marita Koch','RDA','1985-10-06','Canberra'],'F|800':[113.28,'Jarmila Kratochvílová','Tchécoslovaquie','1983-07-26','Munich'],
  'F|1500':[231.95,'Sifan Hassan','Pays-Bas','2019-10-05','Doha'],'F|100h':[12.21,'Yordanka Donkova','Bulgarie','1988-08-20','Stara Zagora'],
  'F|hj':[210,'Yaroslava Mahuchikh','Ukraine','2024-07-07','Paris'],'F|pv':[506,'Yelena Isinbaeva','Russie','2009-08-28','Zurich'],
  'F|lj':[752,'Galina Chistyakova','URSS','1988-06-11','Léningrad'],'F|sp':[22.63,'Natalya Lisovskaya','URSS','1987-06-07','Moscou'],
  'F|dt':[76.80,'Gabriele Reinsch','RDA','1988-07-09','Neubrandenburg'],'F|jt':[72.28,'Barbora Špotáková','République tchèque','2008-09-13','Stuttgart'],
  'M|200':[19.72,'Pietro Mennea','Italie','1979-09-12','Mexico','en altitude'],'M|800':[101.11,'Wilson Kipketer','Danemark','1997-08-24','Cologne']
 },
 NAM:{
  'M|100':[9.58,'Usain Bolt','Jamaïque','2009-08-16','Berlin'],'M|200':[19.19,'Usain Bolt','Jamaïque','2009-08-20','Berlin'],
  'M|400':[43.18,'Michael Johnson','États-Unis','1999-08-26','Séville'],'M|800':[101.20,'Marco Arop','Canada','2024-08-10','Paris'],
  'M|1500':[207.65,'Cole Hocker','États-Unis','2024-08-06','Paris'],'M|110h':[12.75,'Ja’Kobe Tharp','États-Unis','2026-06-10','Eugene'],
  'M|hj':[240,'Charles Austin','États-Unis','1991-08-07','Zurich'],'M|pv':[607,'KC Lightfoot','États-Unis','2023-06-02','Eugene'],
  'M|lj':[895,'Mike Powell','États-Unis','1991-08-30','Tokyo'],'M|sp':[23.56,'Ryan Crouser','États-Unis','2023-05-27','Westwood'],
  'M|jt':[91.29,'Breaux Greer','États-Unis','2007-06-21','Indianapolis'],
  'F|100':[10.49,'Florence Griffith Joyner','États-Unis','1988-07-16','Indianapolis'],'F|200':[21.34,'Florence Griffith Joyner','États-Unis','1988-09-29','Séoul'],
  'F|400':[47.78,'Sydney McLaughlin-Levrone','États-Unis','2025-09-18','Tokyo'],'F|800':[114.97,'Athing Mu','États-Unis','2023-09-17','Eugene'],
  'F|1500':[234.99,'Shelby Houlihan','États-Unis','2019-10-05','Doha'],'F|100h':[12.14,'Masai Russell','États-Unis','2026-05-23',''],
  'F|hj':[205,'Chaunté Lowe','États-Unis','2010-06-26','Des Moines'],'F|pv':[500,'Sandi Morris','États-Unis','2016-09-09','Bruxelles'],
  'F|lj':[749,'Jackie Joyner-Kersee','États-Unis','1994-05-22','Sacramento'],'F|sp':[20.76,'Chase Ealey','États-Unis','2023-09-16','Eugene'],
  'F|jt':[68.11,'Kara Winger','États-Unis','2022-09-02','Zurich']
 }
}};
const EUROPE=['France','Allemagne','Estonie','Royaume-Uni','Espagne','Pologne','Pays-Bas','Belgique','Ukraine','République tchèque','Suède','Finlande','Italie','Norvège','Danemark','Bulgarie','Lituanie','Suisse','URSS','RDA','Tchécoslovaquie','Russie','Slovénie','Israël'];
const NAMER=['États-Unis','Canada','Grenade','Cuba','Jamaïque','Bahamas'];
const contOf=n=>EUROPE.indexOf(n)>=0?'EUR':NAMER.indexOf(n)>=0?'NAM':'';
/* records nationaux : on en déduit le meilleur de chaque nation à partir de toutes les listes ci-dessus (la base est extensible via NAT) */
const NAT={};
function addNat(tier,rows){Object.keys(rows).forEach(k=>{const r=rows[k],n=r[2];if(!n)return;const key=(tier==='WB'?'':'')+k;NAT[n]=NAT[n]||{};const trk=/\|(i:)?(100|200|400|800|1500|60|60h|100h|110h|1000)$/.test(k);const cur=NAT[n][k];if(!cur||(trk?r[0]<cur[0]:r[0]>cur[0]))NAT[n][k]=r;});}
addNat('W',R.W);addNat('EUR',R.C.EUR);addNat('NAM',R.C.NAM);
/* records nationaux établis hors des listes ci-dessus (ex. record de France des épreuves isolées) : à compléter */
/* Israël : records nationaux (source : liste Wikipedia des records israéliens en athlétisme ; épreuves du décathlon et de l'heptathlon) */
const ISR={
 'M|100':[10.20,'Aleksandr Porkhomovskiy','Israël','1999-08-21','Séville'],'M|400':[45.04,'Donald Sanford','Israël','2015-07-19','Joukovski'],
 'M|1500':[220.64,'Jonathan Carmin','Israël','2024-05-03','Fayetteville'],'M|110h':[13.85,'Michael Illin','Israël','2007-06-10','Bucarest'],
 'M|lj':[799,'Yochai Halevi','Israël','2010-05-15','Tel Aviv'],'M|hj':[236,'Konstantin Matusevich','Israël','2000-02-05','Perth'],
 'M|pv':[593,'Aleksandr Averbukh','Israël','2003-07-19','Madrid'],'M|sp':[19.09,'Igor Avrunin','Israël','1991-06-22','Athènes'],
 'M|dt':[62.24,'Igor Avrunin','Israël','1991-06-01','Tel Aviv'],'M|jt':[81.94,'Vadim Bavikin','Israël','2004-06-08','Saragosse'],
 'M|i:60':[6.68,'Aleksandr Porkhomovskiy','Israël','1999-02-21','Samara'],'M|i:1000':[143.87,'Dustin Emrani','Israël','2012-01-13','New York'],
 'M|i:60h':[7.86,'Dor Hayon','Israël','2024-01-28','Bratislava'],
 'F|100h':[12.80,'Irina Lenskiy','Israël','2002-07-07','Rethymno'],'F|800':[122.59,'Shanie Landen','Israël','2024-06-18','Oslo']
};
NAT['Israël']=Object.assign(NAT['Israël']||{},ISR);
R.NATTOT={'Israël':{DEC:[7343,'Ariel Atias','Israël','2023-05-13','Des Moines'],HEPI:[5680,'Etamar Bhastekar','Israël','2021-01-29','Fayetteville'],
 HEP:[6031,'Svetlana Gnezdilov','Israël','2003-08-12','Tel Aviv'],PENI:[3993,'Marina Lippis','Israël','1999-02-18','Minsk']}};
R.NAT=NAT;R.contOf=contOf;
R.CONT_NAME={EUR:'Europe',NAM:'Amérique du Nord, centrale et Caraïbes'};
if(typeof module!=='undefined'&&module.exports)module.exports=R;else root.RECORDS=R;
})(typeof self!=='undefined'?self:this);
