
export interface DBlogInstanceOptions {
  contentPath: string,
  webPath: string
}

export class DBlogInstance {
  constructor(public options: DBlogInstanceOptions){}
}
