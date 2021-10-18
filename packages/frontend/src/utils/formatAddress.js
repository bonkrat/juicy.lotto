export default function (address) {
  return address.substring(0, 10) + "..." + address.substr(address.length - 10, 10);
}
