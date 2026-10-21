// localStorage-ით შენახვა და ჩატვირთვა
export function saveResumeData(data) {
  try {
    localStorage.setItem("cvbuilder_data", JSON.stringify(data));
    alert("რეზიუმე წარმატებით შეინახა!");
  } catch (error) {
    console.error("შენახვის შეცდომა:", error);
  }
}

export function loadResumeData() {
  try {
    const savedData = localStorage.getItem("cvbuilder_data");
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error("ჩატვირთვის შეცდომა:", error);
    return null;
  }
}
