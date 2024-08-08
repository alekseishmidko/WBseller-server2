import * as ExcelJS from 'exceljs';
import { keyMap } from './keyMap';

export const transformArrayToExcel = async (data: any[]) => {
  const inputData = [...data];
  const jsonData = inputData.map((item) => {
    const newItem = {};
    for (const key in item) {
      if (keyMap[key]) {
        newItem[keyMap[key]] = item[key];
      } else {
        newItem[key] = item[key];
      }
    }
    return newItem;
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  const headers = Object.keys(jsonData[0]);
  worksheet.addRow(headers);
  // Добавление данных из JSON в таблицу Excel
  jsonData.forEach((row) => {
    const values = headers.map((header) => row[header]);
    worksheet.addRow(values);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// замена ключей из распаршенного отчета загруженного файлом
export const replaceKeys = (data, keyMapping) => {
  return data.map((item) => {
    const newItem = {};
    Object.keys(item).forEach((key) => {
      const newKey = keyMapping[key] || key;
      newItem[newKey] = item[key];
    });
    return newItem;
  });
};
