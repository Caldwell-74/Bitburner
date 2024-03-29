import { NS, NetscriptPort } from '@ns';
import { COLORS, CONSTANTS } from './ButtonConstants.js';

/**
ButtonConfig {  
  id: string;                       
  text: string;                     text that will be displayed left of the button  
  data: Options object;           
  sticky?: boolean;                 button behaves like a toggle or not 
  init?: boolean;                   initial value defaults to false
  buttText?: [string, string];      text on button as [OFF, ON] state defaults to ["OFF", "ON"]
}
Options {
  mode: 'script' | 'port' | 'file'; depending on the choice here the corresponding Param needs to be included all others will be ignored
  script?: ScriptParams; 
  port?: PortParams;
  file?: FileParams;
}
ScriptParams {
  fileName: string;
  hostName?: string;                  defaults to defaultServer set in ButtonConstants
  threads?: number;                   deafults to defaultThreads set in ButtonConstants 
  args?: [];                        
  autoLaunch?: number;                if set sticky is true it will relaunch the script that often in ms
}
PortParams {
  portNum: number | 'prompt' | 'ns.pid';            "prompt" will ask everytime it runs for a new input
  data?: string | number | object | [] | 'prompt';  it JSON.stringifys the input 
}
FileParams {
  fileName: string | 'prompt';                      "prompt" will ask everytime it runs for a new input
  server?: string | 'prompt';                       "prompt" will ask everytime it runs for a new input
  data?: string | number | object | [] | 'prompt';  it JSON.stringifys the input 
  mode?: 'a' | 'w' | 'prompt';                      "prompt" will ask everytime it runs for a new input
} 
i included an example button that will either "light" or "hard" (depending on the ButtonConstants setting) relaunch the script
light means it will just add new Buttons from buttonConfigs where hard means destroy all old buttons and recreate them wich is needed when you want to change the order
 

 */






/** @param {import("../").NS} ns */
export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  const port = ns.getPortHandle(ns.pid);
  let buttons = LoadCreateStart(ns);
  ns.atExit(() => buttons.forEach((button) => button.exit()));
  while (true) {
    await port.nextWrite();
    buttons = LoadCreateStart(ns, CONSTANTS.restart === 'hard' ? [] : buttons);
  }
}
function LoadCreateStart(ns: NS, buttons: Button[] = []): Button[] {
  let configs: ButtonConfig[] = JSON.parse(ns.read(CONSTANTS.saveFile))
    .sort((a: ButtonConfig, b: ButtonConfig) => Number(a.id.substring(1)) - Number(b.id.substring(1)))
    .filter((config: ButtonConfig) => buttons.every((button: Button) => config.id !== button._id));
  for (const setting of configs) {
    if (setting.data.mode === 'port' && setting.data.port?.portNum === 'ns.pid') setting.data.port.portNum = ns.pid;
    let button = new Button(ns, setting.id, setting);
    button.startUp();
    buttons.push(button);
  }
  return buttons;
}
class Button {
  doc: Document = eval('document');
  draggable: Element = this.doc.querySelectorAll('.react-draggable:first-of-type')[0];

  text: string;
  data: Options;
  sticky: boolean;
  init: boolean;
  buttText: [string, string];

  itself: HTMLButtonElement | null;
  table: HTMLTableElement | null;

  constructor(private ns: NS, private id: string, data: ButtonConfig) {
    this.text = data.text;
    this.data = data.data;
    this.init = data.init ?? false;
    this.sticky = data.sticky ?? true;
    this.buttText = data.buttText ?? ['OFF', 'ON'];

    this.itself = null;
    this.table = null;
  }
  get _id() {
    return this.id;
  }
  get Init() {
    return this.init;
  }
  private ButtonStyle(): string {
    return `color:${COLORS.text};
    margin:0px auto;
    font-family:${CONSTANTS.font};
    font-size:15px;
    text-align:left;
    `;
  }
  private ButtonCode(): string {
    return `<button id=${this.id} style="
    border: 2px solid transparent;
    border-radius: 7px;
    border-color:${COLORS.border};
    background-color:${COLORS.background[Number(this.init)]};
    width:auto; 
    height:fit-content;
    align:center;
    font-family:${CONSTANTS.font};
    font-size:10px;
    color:${COLORS.button};
    ">${this.buttText[Number(this.init)]}</button>`;
  }
  private HTML(): string {
    return `<table id=${'t' + this.id} style="width:90%; border:0px; margin-left:auto; margin-right:auto;">
            <tr>
                <th style="${this.ButtonStyle()}">${this.text}</th>
                <th style="text-align:right">${this.ButtonCode()}</th>
            </tr>
        </table>`;
  }
  startUp() {
    const gotOptions = this.checkOptions();
    if (!gotOptions) this.ns.alert(`Error in Options, Mode: ${this.data.mode} Params: ${this.data[this.data.mode]}`);
    this.createButton();
  }
  checkOptions(): boolean {
    if (this.data.mode === 'script' && this.data.script) {
      this.data.script.hostName = this.data.script.hostName ?? CONSTANTS.defaultServer;
      this.data.script.threads = this.data.script.threads ?? CONSTANTS.defaultThreads;
      this.data.script.args = this.data.script.args ?? [];
      this.data.script.pid = 0;
      return true;
    } else if (this.data.mode === 'port' && this.data.port) {
      this.data.port.data = this.data.port.data ?? 0;
      this.sticky = false;
      return true;
    } else if (this.data.mode === 'file' && this.data.file) {
      this.data.file.server = this.data.file.server ?? CONSTANTS.defaultServer;
      this.data.file.mode = this.data.file.mode ?? 'w';
      this.sticky = false;
      return true;
    }
    return false;
  }
  run() {
    if (this.data.script) {
      this.data.script.pid = this.ns.exec(
        this.data.script.fileName,
        this.data.script.hostName as string,
        this.data.script.threads,
        ...(this.data.script.args as []),
      );
      if (!this.data.script.pid)
        this.ns.alert(
          `Couldnt launch Script ${this.data.script?.fileName} with ${this.data.script?.threads} Threads on ${this.data.script?.hostName}`,
        );
    }
  }
  async script() {
    const isRunning = this.data.script?.pid
      ? this.ns.isRunning(this.data.script?.pid)
      : this.ns.isRunning(
          this.data.script?.fileName as string,
          this.data.script?.hostName,
          ...(this.data.script?.args as []),
        );
    if (this.init && !isRunning) {
      this['run']();
    } else if (!this.init && isRunning) {
      this.ns.kill(this.data.script?.pid as number);
    }
    if (this.init && this.data.script?.autoLaunch && !this.data.script.autoLaunchRunning) {
      this.data.script.autoLaunchRunning = true;
      setTimeout(() => {
        if (this.data.script) {
          this.data.script.autoLaunchRunning = false;
          this.script();
        }
      }, this.data.script.autoLaunch);
    }
  }
  async port() {
    const portNum: number =
      this.data.port?.portNum === 'prompt'
        ? Number(await this.ns.prompt(`Wich port number for ${this.text}`, { type: 'text' }))
        : (this.data.port?.portNum as number);
    const data =
      this.data.port?.data === 'prompt'
        ? await this.ns.prompt(`Data to write to port number ${portNum} for Button ${this.text}`, { type: 'text' })
        : this.data.port?.data;
    const portHandle = this.ns.getPortHandle(portNum);
    portHandle.write(JSON.stringify(data));
  }
  async file() {
    const fileName =
      this.data.file?.fileName === 'prompt'
        ? ((await this.ns.prompt('Filename to write', { type: 'text' })) as string)
        : (this.data.file?.fileName as string);
    const data =
      this.data.file?.data === 'prompt'
        ? await this.ns.prompt('What to write?', { type: 'text' })
        : this.data.file?.data;
    const mode =
      this.data.file?.mode === 'prompt'
        ? ((await this.ns.prompt('Wich mode to Write', { type: 'select', choices: ['a', 'w'] })) as 'a' | 'w')
        : (this.data.file?.mode as 'a' | 'w');
    if (!fileName || !data || !mode)
      this.ns.alert(
        `Error in File Button Routine fileName: ${fileName} data: ${data} mode: ${mode} button: ${this.text}`,
      );
    else this.ns.write(fileName, JSON.stringify(data), mode);
  }
  createButton() {
    this.draggable.insertAdjacentHTML('beforeend', this.HTML());
    this.itself = this.doc.querySelector('#' + this.id);
    this.table = this.doc.querySelector('#t' + this.id);
    if (this.itself != null) {
      this.itself.addEventListener('click', () => {
        if (this.itself != null) {
          this.init = !this.init;
          this.itself.innerText = this.buttText[Number(this.init)];
          this.itself.style.backgroundColor = COLORS.background[Number(this.init)];
          this[this.data.mode]();
          if (!this.sticky) {
            setTimeout(() => {
              if (this.itself != null) {
                this.init = !this.init;
                this.itself.innerText = this.buttText[Number(this.init)];
                this.itself.style.backgroundColor = COLORS.background[Number(this.init)];
              }
            }, 200);
          }
        }
      });
    }
  }
  exit() {
    if (this.table) this.table.remove();
  }
}

interface ButtonConfig {
  id: string;
  text: string;
  sticky?: boolean;
  init?: boolean;
  buttText?: [string, string];
  data: Options;
}
interface Options {
  mode: 'script' | 'port' | 'file';
  script?: ScriptParams;
  port?: PortParams;
  file?: FileParams;
}
interface ScriptParams {
  fileName: string;
  hostName?: string;
  threads?: number;
  args?: [];
  autoLaunch?: number;
  pid?: number;
  autoLaunchRunning?: boolean;
}
interface PortParams {
  portNum: number | 'prompt' | 'ns.pid';
  portHandle?: NetscriptPort;
  data?: string | number | object | [] | 'prompt';
}
interface FileParams {
  fileName: string | 'prompt';
  server?: string | 'prompt';
  data?: string | number | object | [] | 'prompt';
  mode?: 'a' | 'w' | 'prompt';
}
