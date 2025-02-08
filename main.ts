const input = await Bun.file("input/input1.bf2").text();
const stdout = process.stdout;

const exprs = input.split(/\||\n/).filter((cmd) => cmd !== "");
// console.log(exprs);
if (exprs.length === 0) throw new Error("expected input exprs");

const first = +exprs[0];
if (isNaN(first)) throw new Error("expected number for buffer size");

const labels: Map<string, number> = new Map();
const returnPos: number[] = [];
const buffer = Array(first).fill(0);
let current = 0;
let currentCmd = 1;

scanLabels(exprs);
while (currentCmd < exprs.length) {
  runExpr(exprs[currentCmd]);
  currentCmd++;
}

stdout.write("\n");

function scanLabels(cmds: string[]) {
  cmds.forEach((cmd, index) => {
    if (cmd.startsWith(":") && cmd.length > 1) {
      labels.set(cmd.slice(1), index);
    }
  });
}

function getExprNumber(num: string) {
  if (num === "#") return buffer[current];

  const res = +num;
  if (isNaN(res)) throw new Error("expected number");
  if (res < 0) throw new Error("unexpected skill issue (negative number)");

  return res;
}

function runExpr(expr: string) {
  const parts = expr.split(" ");
  if (parts.length > 1) {
    const first = parts[0];

    if (first !== "#" && (isNaN(+first) || first === "0")) {
      switch (first) {
        case "@": {
          buffer[current] = getExprNumber(parts[1]);
          break;
        }
        case "$": {
          console.log(buffer[current], buffer[current] === 1, buffer);
          if (buffer[current] === 1) runExpr(parts.slice(1).join(" "));
          break;
        }
        case "!$": {
          if (buffer[current] === 0) runExpr(parts.slice(1).join(" "));
          break;
        }
        default:
          break;
      }

      return;
    }

    const numTimes = getExprNumber(first);

    for (let i = 0; i < numTimes; i++) {
      runCmd(parts[1]);
    }

    return;
  }

  runCmd(parts[0]);
}

function runCmd(cmd: string) {
  if (cmd.startsWith("^")) {
    const goto = labels.get(cmd.slice(1));
    if (goto) {
      returnPos.push(currentCmd);
      currentCmd = goto;
    }
  }

  switch (cmd) {
    case "-": {
      buffer[current]--;
      break;
    }
    case "+": {
      buffer[current]++;
      break;
    }
    case ".": {
      stdout.write(String.fromCharCode(buffer[current]));
      break;
    }
    case ",": {
      stdout.write(buffer[current] + "");
      break;
    }
    case ">": {
      current = Math.min(buffer.length, current + 1);
      break;
    }
    case "<": {
      current = Math.max(0, current - 1);
      break;
    }
    case "0": {
      current = 0;
      break;
    }
    case "~": {
      const to = returnPos.pop();
      if (to) currentCmd = to;
      break;
    }
    case "*": {
      returnPos.pop();
      break;
    }
    default:
      break;
  }
}
