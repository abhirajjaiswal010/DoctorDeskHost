import script from "js-sha512";
const { sha512 } = script;

export const generateHash = (data) => {
  const hashString = `${process.env.PAYU_KEY}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1}|${data.udf2}|||||||||${process.env.PAYU_SALT}`;
  return sha512(hashString);
};

export const verifyHash = (data) => {
  const hashString = `${process.env.PAYU_SALT}|${data.status}|||||||||${data.udf2}|${data.udf1}|${data.email}|${data.firstname}|${data.productinfo}|${data.amount}|${data.txnid}|${process.env.PAYU_KEY}`;
  return sha512(hashString);
};
