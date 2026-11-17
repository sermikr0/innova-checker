import net from "node:net";

// Node's happy-eyeballs gives each resolved address only 250 ms and fails the
// whole connection once every attempt has timed out. On a host without IPv6
// that makes every server more than ~250 ms away (South America, Japan,
// India...) unreachable for fetch(), WHOIS and page retrieval alike. Give each
// attempt a realistic budget; per-request timeouts still bound the total.
net.setDefaultAutoSelectFamilyAttemptTimeout(2500);
