#!/bin/bash
# Vigilante: como máximo UN Chrome headless (proceso principal) a la vez. Si aparece un segundo
# (alguien saltó la cola), se termina el más nuevo y se anota en el log.
LOG="${TMPDIR:-/tmp}/curso-vigilante.log"
while true; do
  PIDS=$(ps -axo pid=,command= | grep "MacOS/Google Chrome " | grep -- "--headless" | grep -v -- "--type=" | grep -v grep | sort -n | awk "{print \$1}")
  N=$(echo "$PIDS" | grep -c .)
  if [ "$N" -gt 1 ]; then
    EXTRA=$(echo "$PIDS" | tail -n +2)
    echo "$(date '+%F %T') $N Chrome headless a la vez; termino los más nuevos: $EXTRA" >> "$LOG"
    for p in $EXTRA; do ps -o command= -p $p | cut -c1-300 >> "$LOG"; kill $p 2>/dev/null; done
  fi
  sleep 3
done
