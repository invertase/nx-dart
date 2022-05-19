import { chmodSync } from 'fs';
import { argv } from 'process';

chmodSync(argv[2], 0o777);
